// ─────────────────────────────────────────────────────────────────────────────
//  EVChatScreen.tsx — Full Notebook Parity + Modern Voice UI + Continue Chat
//                     + AsyncStorage persistence (survives app restarts)
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
  Animated,
  Easing,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

const STATUS_BAR_HEIGHT =
  Platform.OS === 'android' ? StatusBar.currentHeight ?? 24 : 0;
const TOP_INSET = Platform.OS === 'ios' ? 44 : 0;
const BOTTOM_INSET = Platform.OS === 'ios' ? 34 : 0;

const STORAGE_KEY = 'ev_chat_sessions_v1';

const C = {
  bg: '#0D0D0F',
  surface: '#18181B',
  surfaceAlt: '#27272A',
  surfaceHigh: '#323237',
  border: '#3F3F46',
  divider: '#27272A',
  primary: '#10A37F',
  primaryDark: '#0C8066',
  danger: '#EF4444',
  dangerBg: '#2D1515',
  textPrimary: '#ECECEC',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',
  inputBg: '#27272A',
  placeholder: '#52525B',
};

// ── Chat completion now goes through OpenRouter using GPT-4o ──
const OPENROUTER_MODEL = 'openai/gpt-4o';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_SITE_URL = 'https://your-app-domain-or-repo.example'; // optional attribution
const OPENROUTER_SITE_NAME = 'EV Assistant'; // optional attribution

// ── Whisper transcription stays on Groq directly — OpenRouter has no STT endpoint ──

const PINECONE_HOST =
  'https://ev-chatbot-dataset-tj1t2pp.svc.aped-4627-b74a.pinecone.io';
const EMBED_MODEL = 'llama-text-embed-v2';

const SYSTEM_PROMPT = `You are a professional and friendly Electric Vehicle (EV) expert assistant. Your role is to provide clear, accurate, and helpful answers about electric vehicles based on your knowledge.

CRITICAL INSTRUCTIONS:
1. Provide direct, professional answers WITHOUT mentioning where you got the information from.
2. DO NOT say phrases like "according to the context", "based on the documents", "the data shows", "as mentioned in", etc.
3. Simply state the information naturally and confidently as if it is your expertise.
4. ONLY answer questions related to electric vehicles — including EV technology, battery systems, charging infrastructure, EV models, range, performance, environmental impact, EV policy, maintenance, buying advice, comparison with ICE vehicles, autonomous driving in EVs, EV market trends, and related topics.
5. If the question is NOT related to electric vehicles, politely respond exactly: "I'm sorry, but your question does not appear to be related to electric vehicles. I can only assist with EV-related queries. Please ask me anything about electric vehicles!"
6. If you lack sufficient information to answer an EV question, say: "I don't have enough information on that specific EV topic. Could you rephrase or ask something else about electric vehicles?"
7. Be conversational, warm, and professional in tone.
8. Provide clear, well-structured answers.
9. Reference previous conversation naturally when relevant.`;

type Role = 'user' | 'assistant' | 'system';

interface Message {
  id: string;
  role: Role;
  text: string;
  timestamp: Date;
  isError?: boolean;
}

interface HistoryEntry {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatSession {
  id: string;
  label: string;
  messages: Message[];
  createdAt: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Storage helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Revive plain-object timestamps back to Date instances after JSON.parse */
function hydrateSessions(raw: any[]): ChatSession[] {
  return raw.map(s => ({
    ...s,
    createdAt: new Date(s.createdAt),
    messages: s.messages.map((m: any) => ({
      ...m,
      timestamp: new Date(m.timestamp),
    })),
  }));
}

async function loadSessionsFromStorage(): Promise<ChatSession[]> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (!json) return [];
    const parsed = JSON.parse(json);
    return hydrateSessions(parsed);
  } catch (e) {
    console.warn('Failed to load sessions from storage', e);
    return [];
  }
}

async function saveSessionsToStorage(sessions: ChatSession[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.warn('Failed to save sessions to storage', e);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  RAG helpers
// ─────────────────────────────────────────────────────────────────────────────

async function embedQuery(query: string): Promise<number[]> {
  const resp = await fetch('https://api.pinecone.io/embed', {
    method: 'POST',
    headers: {
      'Api-Key': PINECONE_API_KEY,
      'Content-Type': 'application/json',
      'X-Pinecone-API-Version': '2024-10',
    },
    body: JSON.stringify({
      model: EMBED_MODEL,
      inputs: [{ text: query }],
      parameters: { input_type: 'query', truncate: 'END' },
    }),
  });
  if (!resp.ok) throw new Error(`Embed error ${resp.status}`);
  const data = await resp.json();
  return data.data[0].values as number[];
}

async function pineconeQuery(
  vector: number[],
  topK: number = 5,
): Promise<Array<{ text: string; source: string; page: string; score: number }>> {
  const resp = await fetch(`${PINECONE_HOST}/query`, {
    method: 'POST',
    headers: {
      'Api-Key': PINECONE_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ vector, topK, includeMetadata: true }),
  });
  if (!resp.ok) throw new Error(`Pinecone query error ${resp.status}`);
  const data = await resp.json();
  return (data.matches ?? []).map((m: any) => ({
    text: m.metadata?.text ?? '',
    source: m.metadata?.source ?? 'Unknown',
    page: m.metadata?.page ?? 'Unknown',
    score: m.score ?? 0,
  }));
}

async function ragChat(
  question: string,
  history: HistoryEntry[],
): Promise<{ answer: string; sourceCount: number }> {
  const queryVector = await embedQuery(question);
  const matches = await pineconeQuery(queryVector, 5);
  const context = matches.length
    ? matches.map(m => m.text).join('\n\n')
    : 'No relevant context found.';

  const chatHistoryStr = history
    .map(m => `${m.role === 'user' ? 'Human' : 'AI'}: ${m.content}`)
    .join('\n');

  const userContent = `Context information:\n${context}\n\nConversation History:\n${chatHistoryStr}\n\nCurrent Question: ${question}`;

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.map(h => ({ role: h.role, content: h.content })),
    { role: 'user', content: userContent },
  ];

  const resp = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': OPENROUTER_SITE_URL, // optional, for OpenRouter rankings
      'X-Title': OPENROUTER_SITE_NAME, // optional, shows in OpenRouter dashboard
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages,
      max_tokens: 1024,
      temperature: 0.3,
    }),
  });
  if (!resp.ok) throw new Error(`OpenRouter error ${resp.status}`);
  const data = await resp.json();
  const answer = data.choices?.[0]?.message?.content?.trim() ?? 'No response.';
  return { answer, sourceCount: matches.length };
}

// ─────────────────────────────────────────────────────────────────────────────
//  MicWaveform
// ─────────────────────────────────────────────────────────────────────────────
const MicWaveform: React.FC<{ active: boolean }> = ({ active }) => {
  const bars = [
    useRef(new Animated.Value(0.4)).current,
    useRef(new Animated.Value(0.4)).current,
    useRef(new Animated.Value(0.4)).current,
    useRef(new Animated.Value(0.4)).current,
    useRef(new Animated.Value(0.4)).current,
  ];

  useEffect(() => {
    if (!active) {
      bars.forEach(b =>
        Animated.spring(b, { toValue: 0.4, useNativeDriver: true }).start(),
      );
      return;
    }
    const anims = bars.map((b, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 80),
          Animated.timing(b, {
            toValue: 1,
            duration: 300,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(b, {
            toValue: 0.3,
            duration: 300,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ),
    );
    anims.forEach(a => a.start());
    return () => anims.forEach(a => a.stop());
  }, [active]);

  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'center', gap: 3, height: 24 }}
    >
      {bars.map((b, i) => (
        <Animated.View
          key={i}
          style={{
            width: 3,
            height: 20,
            borderRadius: 2,
            backgroundColor: active ? C.danger : C.textMuted,
            transform: [{ scaleY: b }],
          }}
        />
      ))}
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  TypingIndicator
// ─────────────────────────────────────────────────────────────────────────────
const TypingIndicator: React.FC = () => {
  const dots = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    const anims = dots.map((d, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(d, {
            toValue: -6,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(d, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.delay(600 - i * 150),
        ]),
      ),
    );
    anims.forEach(a => a.start());
    return () => anims.forEach(a => a.stop());
  }, []);

  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'center', gap: 5, padding: 4 }}
    >
      {dots.map((d, i) => (
        <Animated.View
          key={i}
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: C.textMuted,
            transform: [{ translateY: d }],
          }}
        />
      ))}
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  FormattedText — renders **bold**, # headings and - bullets (no extra package)
// ─────────────────────────────────────────────────────────────────────────────
const stripMarkdown = (t: string) =>
  t
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^(\s*)[-*]\s+/gm, '$1• ');

const renderInline = (line: string, keyPrefix: string) =>
  line.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    /^\*\*[^*]+\*\*$/.test(part) ? (
      <Text key={keyPrefix + i} style={{ fontWeight: '700' }}>
        {part.slice(2, -2)}
      </Text>
    ) : (
      part
    ),
  );

const FormattedText: React.FC<{
  text: string;
  color: string;
  fontSize: number;
  lineHeight: number;
}> = ({ text, color, fontSize, lineHeight }) => {
  const lines = text.split('\n');
  return (
    <Text style={{ color, fontSize, lineHeight }}>
      {lines.map((raw, idx) => {
        const nl = idx < lines.length - 1 ? '\n' : '';
        const heading = raw.match(/^#{1,6}\s+(.*)$/);
        if (heading) {
          return (
            <Text key={idx} style={{ fontWeight: '700' }}>
              {renderInline(heading[1], `h${idx}-`)}
              {nl}
            </Text>
          );
        }
        const bullet = raw.match(/^(\s*)[-*•]\s+(.*)$/);
        if (bullet) {
          const indent = bullet[1].length > 0 ? '      ' : '';
          return (
            <Text key={idx}>
              {indent}•  {renderInline(bullet[2], `b${idx}-`)}
              {nl}
            </Text>
          );
        }
        return (
          <Text key={idx}>
            {renderInline(raw, `l${idx}-`)}
            {nl}
          </Text>
        );
      })}
    </Text>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  MessageBubble
// ─────────────────────────────────────────────────────────────────────────────
const MessageBubble: React.FC<{ item: Message }> = ({ item }) => {
  const isUser = item.role === 'user';
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleSpeak = useCallback(() => {
    if (speaking) {
      Speech.stop();
      setSpeaking(false);
    } else {
      setSpeaking(true);
      Speech.speak(stripMarkdown(item.text), {
        language: 'en-US',
        rate: 0.95,
        pitch: 1.0,
        onDone: () => setSpeaking(false),
        onStopped: () => setSpeaking(false),
        onError: () => setSpeaking(false),
      });
    }
  }, [speaking, item.text]);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        maxWidth: '85%',
        marginBottom: 12,
      }}
    >
      {!isUser && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            marginBottom: 4,
          }}
        >
          <View
            style={{
              width: 22,
              height: 22,
              borderRadius: 11,
              backgroundColor: C.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 11 }}>⚡</Text>
          </View>
          <Text style={{ fontSize: 11, color: C.textMuted, fontWeight: '500' }}>
            EV Assistant
          </Text>
        </View>
      )}

      <View
        style={{
          backgroundColor: isUser ? C.primary : C.surfaceAlt,
          borderRadius: 18,
          borderBottomRightRadius: isUser ? 4 : 18,
          borderBottomLeftRadius: isUser ? 18 : 4,
          paddingVertical: 10,
          paddingHorizontal: 14,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.18,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        <FormattedText
          text={item.text}
          color={item.isError ? C.danger : '#ECECEC'}
          fontSize={15}
          lineHeight={22}
        />
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: isUser ? 'flex-end' : 'flex-start',
          gap: 6,
          marginTop: 3,
          marginHorizontal: 4,
        }}
      >
        <Text style={{ fontSize: 10, color: C.textMuted }}>
          {item.timestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>

        <TouchableOpacity
          onPress={handleSpeak}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{
            width: 22,
            height: 22,
            borderRadius: 11,
            backgroundColor: speaking ? C.primary + '33' : C.surfaceHigh,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: speaking ? C.primary + '55' : C.border,
          }}
        >
          <Text style={{ fontSize: 11, opacity: speaking ? 1 : 0.7 }}>
            {speaking ? '🔊' : '🔈'}
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  HistoryModal — with "Continue this Chat" button
// ─────────────────────────────────────────────────────────────────────────────
const HistoryModal: React.FC<{
  visible: boolean;
  sessions: ChatSession[];
  onClose: () => void;
  onContinue: (session: ChatSession) => void;
}> = ({ visible, sessions, onClose, onContinue }) => {
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(
    null,
  );

  useEffect(() => {
    if (visible) setSelectedSession(null);
  }, [visible]);

  const handleContinue = useCallback(
    (session: ChatSession) => {
      onContinue(session);
      onClose();
    },
    [onContinue, onClose],
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.7)',
          justifyContent: 'flex-end',
        }}
      >
        <View
          style={{
            backgroundColor: C.surface,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: '85%',
            paddingBottom: BOTTOM_INSET + 16,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: C.divider,
            }}
          >
            {selectedSession ? (
              <TouchableOpacity
                onPress={() => setSelectedSession(null)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
              >
                <Text style={{ color: C.primary, fontSize: 15 }}>◀ Back</Text>
              </TouchableOpacity>
            ) : (
              <Text
                style={{
                  color: C.textPrimary,
                  fontSize: 17,
                  fontWeight: '700',
                }}
              >
                All Chats
              </Text>
            )}
            <TouchableOpacity onPress={onClose}>
              <Text style={{ color: C.primary, fontSize: 15 }}>Close</Text>
            </TouchableOpacity>
          </View>

          {/* Session title + Continue button when drilled in */}
          {selectedSession && (
            <View
              style={{
                paddingHorizontal: 16,
                paddingTop: 10,
                paddingBottom: 8,
                borderBottomWidth: 1,
                borderBottomColor: C.divider,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text
                  style={{
                    color: C.textPrimary,
                    fontSize: 15,
                    fontWeight: '700',
                  }}
                  numberOfLines={1}
                >
                  {selectedSession.label}
                </Text>
                <Text
                  style={{ color: C.textMuted, fontSize: 11, marginTop: 2 }}
                >
                  {selectedSession.createdAt.toLocaleString()}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => handleContinue(selectedSession)}
                style={{
                  backgroundColor: C.primary,
                  borderRadius: 10,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <Text style={{ fontSize: 13 }}>💬</Text>
                <Text
                  style={{
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: '600',
                  }}
                >
                  Continue
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Content */}
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            {/* Session list */}
            {!selectedSession &&
              (sessions.length === 0 ? (
                <Text
                  style={{
                    color: C.textMuted,
                    textAlign: 'center',
                    marginTop: 20,
                  }}
                >
                  No chat history yet.
                </Text>
              ) : (
                [...sessions].reverse().map((session, idx) => {
                  const userMsgs = session.messages.filter(
                    m => m.role === 'user',
                  );
                  const preview = userMsgs[0]?.text ?? 'Empty session';
                  return (
                    <TouchableOpacity
                      key={session.id}
                      onPress={() => setSelectedSession(session)}
                      style={{
                        backgroundColor: C.surfaceAlt,
                        borderRadius: 12,
                        padding: 14,
                        marginBottom: 10,
                        borderWidth: 1,
                        borderColor: C.border,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: 4,
                        }}
                      >
                        <Text
                          style={{
                            color: C.primary,
                            fontSize: 12,
                            fontWeight: '700',
                          }}
                        >
                          Chat {sessions.length - idx}
                        </Text>
                        <Text style={{ color: C.textMuted, fontSize: 11 }}>
                          {session.createdAt.toLocaleDateString()}{' '}
                          {session.createdAt.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </View>
                      <Text
                        numberOfLines={2}
                        style={{
                          color: C.textSecondary,
                          fontSize: 13,
                          lineHeight: 18,
                        }}
                      >
                        {preview.length > 120
                          ? preview.slice(0, 120) + '…'
                          : preview}
                      </Text>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginTop: 8,
                        }}
                      >
                        <Text style={{ color: C.textMuted, fontSize: 11 }}>
                          {userMsgs.length} message
                          {userMsgs.length !== 1 ? 's' : ''} · Tap to view
                        </Text>
                        <TouchableOpacity
                          onPress={() => handleContinue(session)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          style={{
                            backgroundColor: C.primaryDark + '33',
                            borderRadius: 8,
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            borderWidth: 1,
                            borderColor: C.primary + '55',
                          }}
                        >
                          <Text
                            style={{
                              color: C.primary,
                              fontSize: 11,
                              fontWeight: '600',
                            }}
                          >
                            Continue ↗
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  );
                })
              ))}

            {/* Drill-in: messages of selected session */}
            {selectedSession &&
              selectedSession.messages
                .filter(m => m.role !== 'system')
                .map(m => (
                  <View key={m.id} style={{ marginBottom: 16 }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        marginBottom: 4,
                      }}
                    >
                      <Text
                        style={{
                          color:
                            m.role === 'user' ? C.primary : C.textSecondary,
                          fontSize: 11,
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                        }}
                      >
                        {m.role === 'user' ? '👤 You' : '⚡ EV Assistant'}
                      </Text>
                      <Text style={{ color: C.textMuted, fontSize: 10 }}>
                        ·{' '}
                        {m.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                    <View
                      style={{
                        backgroundColor:
                          m.role === 'user'
                            ? C.primaryDark + '22'
                            : C.surfaceAlt,
                        borderRadius: 10,
                        padding: 10,
                        borderWidth: 1,
                        borderColor:
                          m.role === 'user' ? C.primary + '33' : C.border,
                      }}
                    >
                      <FormattedText
                        text={m.text}
                        color={C.textPrimary}
                        fontSize={13}
                        lineHeight={20}
                      />
                    </View>
                  </View>
                ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  StatusPill
// ─────────────────────────────────────────────────────────────────────────────
const StatusPill: React.FC<{ label: string; on: boolean }> = ({
  label,
  on,
}) => (
  <View
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: on ? C.primaryDark + '33' : C.surfaceHigh,
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderWidth: 1,
      borderColor: on ? C.primary + '55' : C.border,
    }}
  >
    <View
      style={{
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: on ? C.primary : C.textMuted,
      }}
    />
    <Text
      style={{
        color: on ? C.primary : C.textMuted,
        fontSize: 10,
        fontWeight: '600',
      }}
    >
      {label}
    </Text>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
//  Main Screen
// ─────────────────────────────────────────────────────────────────────────────
const EVChatScreen: React.FC = () => {
  const router = useRouter();
  const makeGreeting = (): Message => ({
    id: 'greeting_' + Date.now(),
    role: 'assistant',
    text: "Hello! I'm your Electric Vehicle assistant. ⚡ How can I help you today?",
    timestamp: new Date(),
  });

  const makeSessionId = () => Math.random().toString(36).slice(2, 10);

  const [sessionId, setSessionId] = useState(makeSessionId);
  const [messages, setMessages] = useState<Message[]>([makeGreeting()]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceInputOn, setVoiceInputOn] = useState(false);
  const [voiceOutputOn, setVoiceOutputOn] = useState(true);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [continuedBanner, setContinuedBanner] = useState(false);
  const [storageReady, setStorageReady] = useState(false);

  const [allSessions, setAllSessions] = useState<ChatSession[]>([]);

  const conversationHistory = useRef<HistoryEntry[]>([]);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // ── Load sessions from AsyncStorage on mount ─────────────────────────────
  useEffect(() => {
    (async () => {
      const saved = await loadSessionsFromStorage();
      setAllSessions(saved);
      setStorageReady(true);
    })();
  }, []);

  // ── Persist sessions to AsyncStorage whenever they change ────────────────
  useEffect(() => {
    if (!storageReady) return; // don't overwrite storage before first load
    saveSessionsToStorage(allSessions);
  }, [allSessions, storageReady]);

  // ── Persist current session whenever messages change ─────────────────────
  useEffect(() => {
    const hasUserMsg = messages.some(m => m.role === 'user');
    if (!hasUserMsg) return;

    setAllSessions(prev => {
      const existing = prev.findIndex(s => s.id === sessionId);
      const firstUserMsg = messages.find(m => m.role === 'user');
      const label = firstUserMsg
        ? firstUserMsg.text.length > 40
          ? firstUserMsg.text.slice(0, 40) + '…'
          : firstUserMsg.text
        : `Session ${sessionId}`;
      const updated: ChatSession = {
        id: sessionId,
        label,
        messages: [...messages],
        createdAt: existing >= 0 ? prev[existing].createdAt : new Date(),
      };
      if (existing >= 0) {
        const copy = [...prev];
        copy[existing] = updated;
        return copy;
      }
      return [...prev, updated];
    });
  }, [messages, sessionId]);

  // ── New blank session ────────────────────────────────────────────────────
  const newSession = useCallback(() => {
    conversationHistory.current = [];
    const newId = makeSessionId();
    setSessionId(newId);
    setMessages([makeGreeting()]);
    setMessageCount(0);
    setContinuedBanner(false);
  }, []);

  // ── Restore a past session and continue it ───────────────────────────────
  const continueSession = useCallback((session: ChatSession) => {
    const rebuilt: HistoryEntry[] = session.messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .filter(m => !m.id.startsWith('greeting_') && !m.id.startsWith('sys_'))
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.text }));

    conversationHistory.current = rebuilt.slice(-20);

    setSessionId(session.id);
    setMessages(
      session.messages.map(m => ({
        ...m,
        timestamp:
          m.timestamp instanceof Date ? m.timestamp : new Date(m.timestamp),
      })),
    );
    setMessageCount(session.messages.filter(m => m.role === 'user').length);
    setContinuedBanner(true);
    setTimeout(() => setContinuedBanner(false), 3000);
  }, []);

  // ── STT helpers ───────────────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert(
          'Permission Required',
          'Microphone permission is needed for voice input.',
        );
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      recordingRef.current = recording;
      setIsRecording(true);
    } catch (e) {
      console.error('startRecording error', e);
      Alert.alert('Error', 'Could not start recording.');
    }
  }, []);

  const addSystemNote = (note: string) => {
    setMessages(prev => [
      ...prev,
      {
        id: 'sys_' + Date.now(),
        role: 'assistant',
        text: note,
        timestamp: new Date(),
        isError: true,
      },
    ]);
  };

  // ── Core send ─────────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (text: string) => {
      const question = text.trim();
      if (!question || isLoading) return;

      setInputText('');

      const userMsg: Message = {
        id: 'u_' + Date.now(),
        role: 'user',
        text: question,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMsg]);
      setIsLoading(true);

      try {
        const { answer } = await ragChat(question, conversationHistory.current);

        conversationHistory.current = [
          ...conversationHistory.current,
          { role: 'user', content: question },
          { role: 'assistant', content: answer },
        ];
        if (conversationHistory.current.length > 20) {
          conversationHistory.current = conversationHistory.current.slice(-20);
        }

        setMessageCount(c => c + 1);

        const assistantMsg: Message = {
          id: 'a_' + Date.now(),
          role: 'assistant',
          text: answer,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMsg]);
      } catch (e: any) {
        addSystemNote(
          `Error: ${e?.message ?? 'Unknown error'}. Please try again.`,
        );
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading],
  );

  const stopRecordingAndTranscribe = useCallback(async () => {
    const recording = recordingRef.current;
    if (!recording) return;

    recordingRef.current = null;
    setIsRecording(false);

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      if (!uri) throw new Error('No recording URI');

      const formData = new FormData();
      formData.append('file', {
        uri,
        type: 'audio/m4a',
        name: 'voice.m4a',
      } as any);
      formData.append('model', 'whisper-large-v3');
      formData.append('language', 'en');

      const resp = await fetch(
        'https://api.groq.com/openai/v1/audio/transcriptions',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
          body: formData,
        },
      );

      if (!resp.ok) throw new Error(`Whisper error ${resp.status}`);
      const data = await resp.json();
      const transcript = (data.text ?? '').trim();

      if (transcript) {
        await sendMessage(transcript);
      } else {
        addSystemNote("Didn't catch that — please try again.");
      }
    } catch (e) {
      console.error('transcription error', e);
      addSystemNote('Voice transcription failed. Please try again.');
    }
  }, [sendMessage]);

  // ── Continuous voice mode ─────────────────────────────────────────────────
  useEffect(() => {
    if (!voiceInputOn || isLoading) return;
    (async () => {
      await startRecording();
    })();
    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => { });
        recordingRef.current = null;
        setIsRecording(false);
      }
    };
  }, [voiceInputOn]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, isLoading]);

  // ─────────────────────────────────────────────────────────────────────────
  //  Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: C.surface,
        paddingTop: TOP_INSET,
        paddingBottom: BOTTOM_INSET,
      }}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      <View style={{ flex: 1, backgroundColor: C.bg }}>
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingTop: Platform.OS === 'android' ? STATUS_BAR_HEIGHT + 12 : 12,
            paddingBottom: 12,
            backgroundColor: C.surface,
            borderBottomWidth: 1,
            borderBottomColor: C.divider,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TouchableOpacity
              onPress={() => router.back()}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={{ color: C.textSecondary, fontSize: 28 }}>‹</Text>
            </TouchableOpacity>
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: C.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 18 }}>⚡</Text>
            </View>
            <View>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: C.textPrimary,
                }}
              >
                EV Assistant
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={() => setHistoryVisible(true)}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                backgroundColor: C.surfaceAlt,
                borderRadius: 10,
              }}
            >
              <Text style={{ color: C.textSecondary, fontSize: 12 }}>
                History
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={newSession}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                backgroundColor: C.surfaceAlt,
                borderRadius: 10,
              }}
            >
              <Text style={{ color: C.textSecondary, fontSize: 12 }}>New</Text>
            </TouchableOpacity>
          </View>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'android' ? STATUS_BAR_HEIGHT : 0}

        >
          {/* ── "Continued from history" banner ───────────────────────────── */}
          {continuedBanner && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                marginHorizontal: 12,
                marginTop: 8,
                backgroundColor: C.primaryDark + '33',
                borderRadius: 10,
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderWidth: 1,
                borderColor: C.primary + '55',
              }}
            >
              <Text style={{ fontSize: 14 }}>🔁</Text>
              <Text style={{ color: C.primary, fontSize: 13, flex: 1 }}>
                Resumed from history — you can keep chatting!
              </Text>
            </View>
          )}

          {/* ── Message list ──────────────────────────────────────────────── */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={m => m.id}
            contentContainerStyle={{
              padding: 16,
              paddingBottom: 8,
              flexGrow: 1,
            }}
            renderItem={({ item }) => <MessageBubble item={item} />}
            ListFooterComponent={
              isLoading ? (
                <View
                  style={{
                    alignSelf: 'flex-start',
                    maxWidth: '80%',
                    backgroundColor: C.surfaceAlt,
                    borderRadius: 18,
                    borderBottomLeftRadius: 4,
                    padding: 12,
                    marginBottom: 12,
                  }}
                >
                  <TypingIndicator />
                </View>
              ) : null
            }
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
          />

          {/* ── Voice-mode banner ─────────────────────────────────────────── */}
          {voiceInputOn && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                marginHorizontal: 12,
                marginBottom: 6,
                backgroundColor: isRecording ? C.dangerBg : C.surfaceAlt,
                borderRadius: 14,
                padding: 12,
                borderWidth: 1,
                borderColor: isRecording ? C.danger + '55' : C.border,
              }}
            >
              <MicWaveform active={isRecording} />
              <Text
                style={{
                  flex: 1,
                  color: isRecording ? C.danger : C.textSecondary,
                  fontSize: 13,
                }}
              >
                {isRecording
                  ? 'Listening… tap mic to send'
                  : 'Voice mode active'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setVoiceInputOn(false);
                  if (recordingRef.current) stopRecordingAndTranscribe();
                }}
              >
                <Text style={{ color: C.textMuted, fontSize: 12 }}>
                  Disable
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Input bar ────────────────────────────────────────────────── */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-end',
              padding: 12,
              gap: 8,
              backgroundColor: C.surface,
              borderTopWidth: 1,
              borderTopColor: C.divider,
            }}
          >
            <TextInput
              style={{
                flex: 1,
                minHeight: 44,
                maxHeight: 120,
                backgroundColor: C.inputBg,
                borderRadius: 22,
                paddingHorizontal: 16,
                paddingVertical: 12,
                color: C.textPrimary,
                fontSize: 15,
                borderWidth: 1,
                borderColor: C.border,
              }}
              value={inputText}
              onChangeText={setInputText}
              placeholder={
                voiceInputOn ? 'Voice mode active…' : 'Ask me about EVs…'
              }
              placeholderTextColor={C.placeholder}
              multiline
              editable={!voiceInputOn}
              onSubmitEditing={() => sendMessage(inputText)}
              returnKeyType="send"
              blurOnSubmit={false}
            />

            {/* 🎙 Voice toggle */}
            <TouchableOpacity
              onPress={() => {
                if (voiceInputOn) {
                  setVoiceInputOn(false);
                  if (isRecording) stopRecordingAndTranscribe();
                } else {
                  setVoiceInputOn(true);
                }
              }}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: voiceInputOn
                  ? isRecording
                    ? C.danger
                    : C.primary
                  : C.surfaceAlt,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: voiceInputOn ? 'transparent' : C.border,
              }}
            >
              {voiceInputOn && isRecording ? (
                <MicWaveform active />
              ) : (
                <Text style={{ fontSize: 20 }}>🎙</Text>
              )}
            </TouchableOpacity>

            {/* ➤ Send button */}
            <TouchableOpacity
              onPress={() => sendMessage(inputText)}
              disabled={isLoading || !inputText.trim()}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor:
                  inputText.trim() && !isLoading ? C.primary : C.surfaceAlt,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isLoading ? (
                <ActivityIndicator color={C.textSecondary} size="small" />
              ) : (
                <Text
                  style={{
                    color: inputText.trim() ? '#fff' : C.textMuted,
                    fontSize: 18,
                  }}
                >
                  ➤
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* ── Voice output toggle row ───────────────────────────────────── */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              paddingBottom: Platform.OS === 'android' ? 8 : 4,
              backgroundColor: C.surface,
            }}
          >
            <TouchableOpacity
              onPress={() => setVoiceOutputOn(v => !v)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}
            ></TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>

      {/* ── History modal ─────────────────────────────────────────────────── */}
      <HistoryModal
        visible={historyVisible}
        sessions={allSessions}
        onClose={() => setHistoryVisible(false)}
        onContinue={continueSession}
      />
    </View>
  );
};

export default EVChatScreen;