import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Animated,
  ScrollView,
  Modal,
  Alert,
  Easing,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import * as Speech from "expo-speech";
import { Audio } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import {
  generateCertificateHTML,
  generateChatTranscriptHTML,
  printHtmlOnWeb,
  BatteryReportData,
} from "./certificateTemplate";

const STORAGE_KEY = "smartev_chat_sessions_v1";
const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || "";

const getBaseUrl = () => {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;
  if (hostUri) return "http://" + hostUri.split(":")[0] + ":8000";
  return "http://localhost:8000";
};

interface Source {
  text: string;
  score: number;
  source: string;
}

interface Message {
  id: string;
  role: "user" | "bot";
  text: string;
  timestamp: Date;
  suggestions?: string[];
  sources?: Source[];
  data_source?: string;
  isError?: boolean;
  reportData?: BatteryReportData;
}

interface ChatSession {
  id: string;
  label: string;
  messages: Message[];
  createdAt: Date;
}

const WELCOME: Message = {
  id: "welcome",
  role: "bot",
  timestamp: new Date(),
  text: "Welcome to SmartEV AI\n\nI am powered by RAG and your live vehicle telemetry (EV-001) to provide real-time battery diagnostics, charging optimisation, and fleet guidance.\n\nAsk me anything, speak a voice command, or tap 📄 PDF Cert to generate your official Battery Health Certificate!",
  suggestions: [
    "📄 Battery Health Certificate PDF",
    "Battery State of Health?",
    "Charging optimisation",
    "Anomaly report",
  ],
};

function safeDate(val: any): Date {
  if (!val) return new Date();
  const d = new Date(val);
  return isNaN(d.getTime()) ? new Date() : d;
}

function safeFormatDate(val: any): string {
  const d = safeDate(val);
  return (
    d.toLocaleDateString() +
    " " +
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
}

function hydrateSessions(raw: any): ChatSession[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(s => ({
    id: s.id || Math.random().toString(36).slice(2, 10),
    label: s.label || "Conversation",
    createdAt: safeDate(s.createdAt),
    messages: (s.messages || []).map((m: any) => ({
      ...m,
      timestamp: safeDate(m.timestamp),
    })),
  }));
}

// ── MicWaveform component for live recording feedback ──
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
        Animated.spring(b, { toValue: 0.4, useNativeDriver: true }).start()
      );
      return;
    }
    const anims = bars.map((b, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 80),
          Animated.timing(b, {
            toValue: 1,
            duration: 280,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(b, {
            toValue: 0.3,
            duration: 280,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      )
    );
    anims.forEach(a => a.start());
    return () => anims.forEach(a => a.stop());
  }, [active]);

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 3, height: 22 }}>
      {bars.map((b, i) => (
        <Animated.View
          key={i}
          style={{
            width: 3,
            height: 18,
            borderRadius: 2,
            backgroundColor: active ? "#ef4444" : "#64748b",
            transform: [{ scaleY: b }],
          }}
        />
      ))}
    </View>
  );
};

const TypingIndicator = () => {
  const dots = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];
  useEffect(() => {
    const anims = dots.map((d, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 180),
          Animated.timing(d, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(d, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      )
    );
    anims.forEach(a => a.start());
    return () => anims.forEach(a => a.stop());
  }, []);
  return (
    <View
      style={[
        s.row,
        {
          paddingHorizontal: 14,
          marginBottom: 14,
          alignItems: "center",
          gap: 8,
        },
      ]}
    >
      <View style={s.botAv}>
        <Ionicons name="sparkles" size={13} color="#06b6d4" />
      </View>
      <View
        style={[
          s.bubble,
          s.botBubble,
          { flexDirection: "row", gap: 6, paddingVertical: 14 },
        ]}
      >
        {dots.map((d, i) => (
          <Animated.View
            key={i}
            style={{
              width: 7,
              height: 7,
              borderRadius: 3.5,
              backgroundColor: "#06b6d4",
              opacity: d,
              transform: [
                {
                  translateY: d.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -4],
                  }),
                },
              ],
            }}
          />
        ))}
      </View>
    </View>
  );
};

const renderText = (text: string) =>
  text.split(/(\*\*[^*]+\*\*)/).map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <Text key={i} style={{ fontWeight: "700", color: "#f8fafc" }}>
        {p.slice(2, -2)}
      </Text>
    ) : (
      <Text key={i}>{p}</Text>
    )
  );

const DataSourceBadge = ({ src }: { src: string }) => {
  const colors: Record<string, string> = {
    "rag+gemini+db": "#10b981",
    "rag+gemini": "#06b6d4",
    "gemini+db": "#8b5cf6",
    gemini: "#f59e0b",
    rag_only: "#64748b",
  };
  const labels: Record<string, string> = {
    "rag+gemini+db": "RAG + AI + Live DB",
    "rag+gemini": "RAG + AI",
    "gemini+db": "AI + Live DB",
    gemini: "AI Only",
    rag_only: "Knowledge Base",
  };
  return (
    <View style={[s.badge, { borderColor: colors[src] || "#64748b" }]}>
      <View
        style={{
          width: 5,
          height: 5,
          borderRadius: 2.5,
          backgroundColor: colors[src] || "#64748b",
          marginRight: 4,
        }}
      />
      <Text style={[s.badgeTxt, { color: colors[src] || "#64748b" }]}>
        {labels[src] || src}
      </Text>
    </View>
  );
};

const CertificateCard = ({
  data,
  onPrint,
}: {
  data: BatteryReportData;
  onPrint?: () => void;
}) => {
  const soh = Number(data.current_soh || 87.3).toFixed(1);
  return (
    <View style={s.certCard}>
      {/* Top Header */}
      <View style={s.certCardHdr}>
        <View style={[s.row, { gap: 6 }]}>
          <Ionicons name="shield-checkmark" size={15} color="#10b981" />
          <Text style={s.certCardHdrTxt}>Battery Health Certificate</Text>
        </View>
        <Text style={s.certCardId}>{data.certificate_id}</Text>
      </View>

      {/* Hero SoH and Vehicle info */}
      <View style={s.certCardBody}>
        <View style={s.certHeroLeft}>
          <Text style={s.certHeroScore}>{soh}%</Text>
          <View style={s.certGradePill}>
            <Text style={s.certGradePillTxt}>{data.health_grade}</Text>
          </View>
        </View>

        <View style={s.certHeroRight}>
          <Text style={s.certCarTitle}>
            {data.make} {data.model} ({data.year})
          </Text>
          <Text style={s.certCarSub}>
            Pack: {data.battery_capacity} kWh · SoC: {data.soc}%
          </Text>
          <View style={s.certBarTrack}>
            <View
              style={[
                s.certBarFill,
                { width: `${Math.min(100, Math.max(0, Number(soh)))}%` },
              ]}
            />
          </View>
        </View>
      </View>

      {/* 3 Degradation Projections */}
      <View style={s.certForecastRow}>
        <View style={s.certForecastPill}>
          <Text style={s.certForecastTitle}>3M Forecast</Text>
          <Text style={s.certForecastVal}>{data.forecast_3m}%</Text>
        </View>
        <View style={s.certForecastPill}>
          <Text style={s.certForecastTitle}>6M Forecast</Text>
          <Text style={s.certForecastVal}>{data.forecast_6m}%</Text>
        </View>
        <View style={s.certForecastPill}>
          <Text style={s.certForecastTitle}>12M Forecast</Text>
          <Text style={s.certForecastVal}>{data.forecast_12m}%</Text>
        </View>
      </View>

      {/* Metrics Row */}
      <View style={s.certMetricsRow}>
        <Text style={s.certMetricItem}>⚡ {data.voltage}V</Text>
        <Text style={s.certMetricItem}>🌡️ {data.battery_temp}°C</Text>
        <Text style={s.certMetricItem}>✓ 4 Checks Passed</Text>
      </View>

      {/* 1-Click PDF Button */}
      {onPrint && (
        <TouchableOpacity
          style={s.certDownloadAction}
          onPress={onPrint}
          activeOpacity={0.85}
        >
          <Ionicons name="document-text" size={14} color="#0b0f19" />
          <Text style={s.certDownloadActionTxt}>
            Open / Print Official PDF Certificate
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const Bubble = ({
  msg,
  onChip,
  onGeneratePDF,
}: {
  msg: Message;
  onChip: (t: string) => void;
  onGeneratePDF?: () => void;
}) => {
  const isBot = msg.role === "bot";
  const [showSources, setShowSources] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const hasSources = isBot && msg.sources && msg.sources.length > 0;

  const toggleSpeak = () => {
    if (speaking) {
      Speech.stop();
      setSpeaking(false);
    } else {
      setSpeaking(true);
      Speech.speak(msg.text, {
        language: "en-US",
        rate: 0.95,
        pitch: 1.0,
        onDone: () => setSpeaking(false),
        onStopped: () => setSpeaking(false),
        onError: () => setSpeaking(false),
      });
    }
  };

  return (
    <View style={{ marginBottom: 14 }}>
      <View
        style={[
          s.row,
          isBot ? { justifyContent: "flex-start" } : { justifyContent: "flex-end" },
        ]}
      >
        {isBot && (
          <View style={s.botAv}>
            <Ionicons name="sparkles" size={13} color="#06b6d4" />
          </View>
        )}
        <View
          style={[
            s.bubble,
            isBot ? s.botBubble : s.userBubble,
            msg.reportData && { maxWidth: "92%", paddingHorizontal: 8, paddingVertical: 8 },
          ]}
        >
          {msg.reportData ? (
            <CertificateCard data={msg.reportData} onPrint={onGeneratePDF} />
          ) : (
            <Text style={[s.bubbleTxt, isBot ? s.botTxt : s.userTxt]}>
              {renderText(msg.text)}
            </Text>
          )}
          <View
            style={[
              s.row,
              {
                marginTop: 6,
                justifyContent: "space-between",
                alignItems: "center",
              },
            ]}
          >
            <Text style={s.timeTxt}>
              {safeDate(msg.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              {isBot && msg.data_source && (
                <DataSourceBadge src={msg.data_source} />
              )}
              {isBot && !msg.reportData && (
                <TouchableOpacity
                  onPress={toggleSpeak}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={{
                    padding: 3,
                    borderRadius: 10,
                    backgroundColor: speaking ? "rgba(6,182,212,0.2)" : "transparent",
                  }}
                >
                  <Ionicons
                    name={speaking ? "volume-high" : "volume-medium-outline"}
                    size={14}
                    color={speaking ? "#06b6d4" : "#64748b"}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
        {!isBot && (
          <View style={s.userAv}>
            <Ionicons name="person" size={13} color="#f8fafc" />
          </View>
        )}
      </View>
      {hasSources && (
        <TouchableOpacity
          style={[s.row, { marginLeft: 42, marginTop: 5, gap: 4 }]}
          onPress={() => setShowSources(!showSources)}
        >
          <Ionicons name="library-outline" size={11} color="#38bdf8" />
          <Text style={{ color: "#38bdf8", fontSize: 10.5, fontWeight: "600" }}>
            {showSources
              ? "Hide sources"
              : msg.sources!.length + " knowledge sources"}
          </Text>
          <Ionicons
            name={showSources ? "chevron-up" : "chevron-down"}
            size={10}
            color="#38bdf8"
          />
        </TouchableOpacity>
      )}
      {hasSources && showSources && (
        <View style={s.sourcesBox}>
          {msg.sources!.map((src, i) => (
            <View key={i} style={s.sourceItem}>
              <View style={[s.row, { gap: 5, marginBottom: 3 }]}>
                <Ionicons
                  name="document-text-outline"
                  size={10}
                  color="#94a3b8"
                />
                <Text style={s.srcTitle} numberOfLines={1}>
                  {src.source}
                </Text>
                <Text style={s.srcScore}>score: {src.score}</Text>
              </View>
              <Text style={s.srcText} numberOfLines={2}>
                {src.text}
              </Text>
            </View>
          ))}
        </View>
      )}
      {isBot && msg.suggestions && msg.suggestions.length > 0 && (
        <View
          style={[
            s.row,
            { flexWrap: "wrap", gap: 6, marginTop: 8, paddingLeft: 42 },
          ]}
        >
          {msg.suggestions.map((c, i) => (
            <TouchableOpacity key={i} style={s.chip} onPress={() => onChip(c)}>
              <Text style={s.chipTxt}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

// ── Full Chat History Modal ──
const HistoryModal = ({
  visible,
  sessions,
  activeSessionId,
  onClose,
  onContinue,
  onDeleteSession,
  onClearAll,
  onNewChat,
}: {
  visible: boolean;
  sessions: ChatSession[];
  activeSessionId: string;
  onClose: () => void;
  onContinue: (session: ChatSession) => void;
  onDeleteSession: (sessionId: string) => void;
  onClearAll: () => void;
  onNewChat: () => void;
}) => {
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(
    null
  );
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (visible) {
      setSelectedSession(null);
      setSearch("");
    }
  }, [visible]);

  const filteredSessions = sessions.filter(s => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    if (s.label.toLowerCase().includes(q)) return true;
    return s.messages.some(m => m.text.toLowerCase().includes(q));
  });

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={s.modalOverlay}>
        <View style={s.modalSheet}>
          <View style={s.modalHeader}>
            {selectedSession ? (
              <TouchableOpacity
                onPress={() => setSelectedSession(null)}
                style={s.row}
              >
                <Ionicons name="chevron-back" size={18} color="#38bdf8" />
                <Text style={{ color: "#38bdf8", fontSize: 14, fontWeight: "600" }}>
                  All Chats
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={[s.row, { gap: 6 }]}>
                <Ionicons name="time-outline" size={18} color="#06b6d4" />
                <Text style={s.modalTitle}>
                  Chat History ({sessions.length})
                </Text>
              </View>
            )}

            <View style={[s.row, { gap: 10 }]}>
              {!selectedSession && (
                <TouchableOpacity
                  onPress={() => {
                    onNewChat();
                    onClose();
                  }}
                  style={s.newChatPill}
                >
                  <Ionicons name="add" size={14} color="#0b0f19" />
                  <Text style={s.newChatTxt}>New</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose} style={s.closeBtn}>
                <Ionicons name="close" size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Search bar when viewing list */}
          {!selectedSession && sessions.length > 0 && (
            <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 }}>
              <View style={s.searchBar}>
                <Ionicons name="search" size={14} color="#64748b" />
                <TextInput
                  style={s.searchInput}
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search past conversations..."
                  placeholderTextColor="#475569"
                />
                {search.length > 0 && (
                  <TouchableOpacity onPress={() => setSearch("")}>
                    <Ionicons name="close-circle" size={14} color="#64748b" />
                  </TouchableOpacity>
                )}
              </View>
              <View
                style={[
                  s.row,
                  {
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: 8,
                  },
                ]}
              >
                <Text style={{ color: "#64748b", fontSize: 11 }}>
                  {filteredSessions.length}{" "}
                  {filteredSessions.length === 1 ? "conversation" : "conversations"}
                </Text>
                <TouchableOpacity onPress={onClearAll}>
                  <Text style={{ color: "#ef4444", fontSize: 11, fontWeight: "600" }}>
                    Clear All History
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Session Detail Header when drilled in */}
          {selectedSession && (
            <View style={s.drillInHeader}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={s.drillInTitle} numberOfLines={1}>
                  {selectedSession.label}
                </Text>
                <Text style={{ color: "#64748b", fontSize: 11, marginTop: 2 }}>
                  {safeFormatDate(selectedSession.createdAt)}
                </Text>
              </View>
              <View style={[s.row, { gap: 8 }]}>
                <TouchableOpacity
                  onPress={() => {
                    const id = selectedSession.id;
                    setSelectedSession(null);
                    onDeleteSession(id);
                  }}
                  style={s.trashBtn}
                >
                  <Ionicons name="trash-outline" size={16} color="#ef4444" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    onContinue(selectedSession);
                    onClose();
                  }}
                  style={s.continueBtn}
                >
                  <Ionicons name="chatbubble-ellipses" size={14} color="#0b0f19" />
                  <Text style={s.continueTxt}>Continue</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Content list */}
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            {!selectedSession &&
              (sessions.length === 0 ? (
                <View style={{ alignItems: "center", marginVertical: 36 }}>
                  <Ionicons name="chatbox-outline" size={36} color="#475569" />
                  <Text
                    style={{
                      color: "#64748b",
                      marginTop: 10,
                      fontSize: 13,
                    }}
                  >
                    No chat history yet. Ask a question to begin!
                  </Text>
                </View>
              ) : filteredSessions.length === 0 ? (
                <Text
                  style={{
                    color: "#64748b",
                    textAlign: "center",
                    marginTop: 20,
                  }}
                >
                  No chats match "{search}"
                </Text>
              ) : (
                [...filteredSessions].reverse().map((session, idx) => {
                  const userMsgs = session.messages.filter(
                    m => m.role === "user"
                  );
                  const preview = userMsgs[0]?.text ?? "Empty conversation";
                  const isActive = session.id === activeSessionId;

                  return (
                    <TouchableOpacity
                      key={session.id}
                      onPress={() => setSelectedSession(session)}
                      style={[
                        s.historyCard,
                        isActive && {
                          borderColor: "#06b6d4",
                          backgroundColor: "rgba(6,182,212,0.08)",
                        },
                      ]}
                    >
                      <View
                        style={[
                          s.row,
                          {
                            justifyContent: "space-between",
                            marginBottom: 4,
                          },
                        ]}
                      >
                        <View style={[s.row, { gap: 6 }]}>
                          <Text
                            style={{
                              color: "#38bdf8",
                              fontSize: 12,
                              fontWeight: "700",
                            }}
                          >
                            Chat {sessions.length - idx}
                          </Text>
                          {isActive && (
                            <View style={s.activeBadge}>
                              <Text style={s.activeTxt}>ACTIVE</Text>
                            </View>
                          )}
                        </View>
                        <Text style={{ color: "#64748b", fontSize: 10.5 }}>
                          {safeFormatDate(session.createdAt)}
                        </Text>
                      </View>

                      <Text numberOfLines={2} style={s.historyPreview}>
                        {preview}
                      </Text>

                      <View
                        style={[
                          s.row,
                          {
                            justifyContent: "space-between",
                            marginTop: 10,
                            alignItems: "center",
                          },
                        ]}
                      >
                        <Text style={{ color: "#64748b", fontSize: 11 }}>
                          {userMsgs.length} message
                          {userMsgs.length !== 1 ? "s" : ""}
                        </Text>
                        <View style={[s.row, { gap: 8 }]}>
                          <TouchableOpacity
                            onPress={() => onDeleteSession(session.id)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Ionicons
                              name="trash-outline"
                              size={15}
                              color="#ef4444"
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => {
                              onContinue(session);
                              onClose();
                            }}
                            style={s.cardContinueBtn}
                          >
                            <Text style={s.cardContinueTxt}>Continue ↗</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              ))}

            {/* Drill-in messages */}
            {selectedSession &&
              selectedSession.messages.map(m => (
                <View key={m.id} style={{ marginBottom: 14 }}>
                  <View style={[s.row, { gap: 6, marginBottom: 4 }]}>
                    <Text
                      style={{
                        color: m.role === "user" ? "#38bdf8" : "#06b6d4",
                        fontSize: 11,
                        fontWeight: "700",
                        textTransform: "uppercase",
                      }}
                    >
                      {m.role === "user" ? "You" : "SmartEV AI"}
                    </Text>
                    <Text style={{ color: "#64748b", fontSize: 10 }}>
                      · {safeDate(m.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                  <View
                    style={[
                      s.drillInBubble,
                      m.role === "user"
                        ? { backgroundColor: "#0e7490", alignSelf: "flex-end" }
                        : { backgroundColor: "#182236", alignSelf: "flex-start" },
                    ]}
                  >
                    <Text
                      style={{
                        color: "#f8fafc",
                        fontSize: 13,
                        lineHeight: 18,
                      }}
                    >
                      {m.text}
                    </Text>
                  </View>
                </View>
              ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default function EVChatbot() {
  const router = useRouter();
  const makeSessionId = () => Math.random().toString(36).slice(2, 10);

  const [sessionId, setSessionId] = useState(makeSessionId);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Voice recording & TTS states
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [voiceOutputOn, setVoiceOutputOn] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // History states
  const [historyVisible, setHistoryVisible] = useState(false);
  const [continuedBanner, setContinuedBanner] = useState(false);
  const [storageReady, setStorageReady] = useState(false);
  const [allSessions, setAllSessions] = useState<ChatSession[]>([]);

  const listRef = useRef<FlatList>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<any>(null);
  const webRecognitionRef = useRef<any>(null);

  const scroll = () =>
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);

  // Load chat history from AsyncStorage on mount & inject clean print CSS
  useEffect(() => {
    if (Platform.OS === "web" && typeof document !== "undefined") {
      const id = "smartev-clean-print-css";
      if (!document.getElementById(id)) {
        const style = document.createElement("style");
        style.id = id;
        style.innerHTML = `
          @media print {
            body, html, #root {
              background: #ffffff !important;
              color: #0f172a !important;
              height: auto !important;
              overflow: visible !important;
            }
            /* Hide app chrome: back button, header, input bar, mic, sound pill, suggestion chips */
            [role="navigation"],
            header,
            input,
            textarea,
            button,
            .no-print {
              display: none !important;
            }
          }
        `;
        document.head.appendChild(style);
      }
    }

    (async () => {
      try {
        const json = await AsyncStorage.getItem(STORAGE_KEY);
        if (json) {
          setAllSessions(hydrateSessions(JSON.parse(json)));
        }
      } catch (e) {
        console.warn("Could not load chat sessions:", e);
      } finally {
        setStorageReady(true);
      }
    })();
  }, []);

  // Save sessions to storage whenever changed
  useEffect(() => {
    if (!storageReady) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(allSessions)).catch(
      () => {}
    );
  }, [allSessions, storageReady]);

  // Persist current session when messages change
  useEffect(() => {
    const hasUserMsg = messages.some(m => m.role === "user");
    if (!hasUserMsg) return;

    setAllSessions(prev => {
      const existing = prev.findIndex(s => s.id === sessionId);
      const firstUserMsg = messages.find(m => m.role === "user");
      const label = firstUserMsg
        ? firstUserMsg.text.length > 38
          ? firstUserMsg.text.slice(0, 38) + "…"
          : firstUserMsg.text
        : "Conversation";
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }
      if (webRecognitionRef.current) {
        try {
          webRecognitionRef.current.abort();
        } catch {}
      }
      Speech.stop();
    };
  }, []);

  // New Blank Session
  const newSession = useCallback(() => {
    Speech.stop();
    setSessionId(makeSessionId());
    setMessages([WELCOME]);
    setContinuedBanner(false);
  }, []);

  // Continue a past session
  const continueSession = useCallback((session: ChatSession) => {
    Speech.stop();
    setSessionId(session.id);
    setMessages(
      session.messages.map(m => ({
        ...m,
        timestamp: safeDate(m.timestamp),
      }))
    );
    setContinuedBanner(true);
    setTimeout(() => setContinuedBanner(false), 3500);
    scroll();
  }, []);

  // Delete a session
  const deleteSession = useCallback(
    (idToDelete: string) => {
      setAllSessions(prev => prev.filter(s => s.id !== idToDelete));
      if (sessionId === idToDelete) {
        newSession();
      }
    },
    [sessionId, newSession]
  );

  // Clear all history
  const clearAllHistory = useCallback(() => {
    Alert.alert(
      "Clear All History",
      "Are you sure you want to delete all past chat conversations? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            setAllSessions([]);
            await AsyncStorage.removeItem(STORAGE_KEY);
            newSession();
          },
        },
      ]
    );
  }, [newSession]);

  // ── 1-Click Battery Health Certificate PDF Generator ──
  const handleGeneratePDF = useCallback(
    async (vehicleId: string = "EV-001") => {
      if (isGeneratingPdf) return;
      setIsGeneratingPdf(true);
      try {
        const resp = await fetch(
          `${getBaseUrl()}/api/chatbot/report/${vehicleId}`
        );
        if (!resp.ok) {
          throw new Error(`Server returned HTTP ${resp.status}`);
        }
        const reportData: BatteryReportData = await resp.json();
        const html = generateCertificateHTML(reportData);

        if (Platform.OS === "web") {
          printHtmlOnWeb(html);
        } else {
          const { uri } = await Print.printToFileAsync({ html });
          const canShare = await Sharing.isAvailableAsync();
          if (canShare) {
            await Sharing.shareAsync(uri, {
              UTI: ".pdf",
              mimeType: "application/pdf",
              dialogTitle: `SmartEV Battery Certificate - ${reportData.certificate_id}`,
            });
          } else {
            Alert.alert("Certificate Generated", `Saved to: ${uri}`);
          }
        }

        const certMsg: Message = {
          id: "cert-" + Date.now(),
          role: "bot",
          timestamp: new Date(),
          text: `📄 Official Battery Health Certificate generated for ${reportData.make} ${reportData.model} (ID: ${reportData.certificate_id}).`,
          reportData,
          suggestions: [
            "Explain SoH forecast",
            "Optimal charging schedule?",
            "How to maximise range?",
            "Live telemetry status",
          ],
          data_source: "gemini+db",
        };

        setMessages(prev => {
          const lastIdx = prev.length - 1;
          if (lastIdx >= 0 && prev[lastIdx].reportData) {
            const copy = [...prev];
            copy[lastIdx] = certMsg;
            return copy;
          }
          return [...prev, certMsg];
        });
      } catch (err: any) {
        console.error("PDF generation failed:", err);
        Alert.alert(
          "PDF Generation Error",
          `Could not generate Battery Health Certificate: ${
            err?.message || "Check backend connection."
          }`
        );
      } finally {
        setIsGeneratingPdf(false);
        scroll();
      }
    },
    [isGeneratingPdf]
  );

  // ── Clean Chat Transcript PDF / Print ──
  const handlePrintChat = useCallback(() => {
    const html = generateChatTranscriptHTML(messages, "EV-001");
    if (Platform.OS === "web") {
      printHtmlOnWeb(html);
    } else {
      (async () => {
        try {
          const { uri } = await Print.printToFileAsync({ html });
          const canShare = await Sharing.isAvailableAsync();
          if (canShare) {
            await Sharing.shareAsync(uri, {
              UTI: ".pdf",
              mimeType: "application/pdf",
              dialogTitle: "SmartEV Chat Transcript",
            });
          } else {
            Alert.alert("Transcript Saved", `Saved to: ${uri}`);
          }
        } catch (e: any) {
          Alert.alert("Export Error", e?.message || "Could not export chat transcript.");
        }
      })();
    }
  }, [messages]);

  // Send message to backend
  const send = useCallback(
    async (text: string) => {
      const t = text.trim();
      if (!t || loading) return;

      const userMsg: Message = {
        id: "u" + Date.now(),
        role: "user",
        text: t,
        timestamp: new Date(),
      };
      setMessages(p => [...p, userMsg]);
      setInput("");
      setLoading(true);
      scroll();

      const lower = t.toLowerCase();

      // Print clean chat transcript
      if (
        lower === "print chat" ||
        lower === "export chat" ||
        lower === "chat transcript" ||
        lower === "download chat" ||
        (lower.includes("chat") && (lower.includes("pdf") || lower.includes("print")))
      ) {
        handlePrintChat();
        setLoading(false);
        return;
      }

      // Battery Health Certificate PDF
      const isPdfRequest =
        lower.includes("certificate") ||
        lower.includes("battery report") ||
        lower.includes("health certificate") ||
        lower === "pdf" ||
        lower.includes("export certificate");

      if (isPdfRequest) {
        handleGeneratePDF("EV-001");
        if (
          lower === "📄 battery health certificate pdf" ||
          lower === "battery health certificate pdf" ||
          lower === "generate battery pdf certificate" ||
          lower === "1-click battery pdf certificate"
        ) {
          setLoading(false);
          return;
        }
      }

      try {
        const resp = await fetch(getBaseUrl() + "/api/chatbot/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: t, vehicle_id: "EV-001" }),
        });
        const data = await resp.json();
        const botMsg: Message = {
          id: "b" + Date.now(),
          role: "bot",
          text: data.response,
          timestamp: new Date(),
          suggestions: data.suggestions,
          sources: data.sources || [],
          data_source: data.data_source,
        };
        setMessages(p => [...p, botMsg]);

        // Auto Spoken Reply if enabled
        if (voiceOutputOn && data.response) {
          Speech.stop();
          Speech.speak(data.response, {
            language: "en-US",
            rate: 0.95,
            pitch: 1.0,
          });
        }
      } catch {
        setMessages(p => [
          ...p,
          {
            id: "e" + Date.now(),
            role: "bot",
            timestamp: new Date(),
            text: "Could not reach SmartEV backend. Please check the server is running on port 8000.",
            suggestions: ["Try again", "Battery health check", "Anomaly report"],
          },
        ]);
      } finally {
        setLoading(false);
        scroll();
      }
    },
    [loading, voiceOutputOn, handleGeneratePDF, handlePrintChat]
  );

  // ── Voice Command Handler: Start Recording ──
  const handleStartVoice = useCallback(async () => {
    if (loading || isTranscribing) return;
    Speech.stop();

    // 1. Try Browser Web Speech API on Web
    if (
      Platform.OS === "web" &&
      typeof window !== "undefined" &&
      ((window as any).webkitSpeechRecognition ||
        (window as any).SpeechRecognition)
    ) {
      try {
        const SpeechRec =
          (window as any).SpeechRecognition ||
          (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRec();
        webRecognitionRef.current = recognition;
        recognition.lang = "en-US";
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
          setIsRecording(true);
          setRecordSeconds(0);
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = setInterval(() => setRecordSeconds(s => s + 1), 1000);
        };

        recognition.onresult = (event: any) => {
          if (timerRef.current) clearInterval(timerRef.current);
          setIsRecording(false);
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            send(transcript);
          }
        };

        recognition.onerror = (event: any) => {
          if (timerRef.current) clearInterval(timerRef.current);
          setIsRecording(false);
          console.warn("Web speech error:", event.error);
          if (event.error !== "no-speech") {
            Alert.alert(
              "Voice Input",
              "Speech recognition encountered an issue. Please try again."
            );
          }
        };

        recognition.onend = () => {
          if (timerRef.current) clearInterval(timerRef.current);
          setIsRecording(false);
        };

        recognition.start();
        return;
      } catch (e) {
        console.warn("Web speech fallback to Audio.Recording", e);
      }
    }

    // 2. Audio.Recording via Groq Whisper API (Mobile & Web Audio fallback)
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert(
          "Microphone Permission",
          "Please grant microphone access to send voice commands."
        );
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setIsRecording(true);
      setRecordSeconds(0);

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => setRecordSeconds(s => s + 1), 1000);
    } catch (err: any) {
      console.error("Audio recording error:", err);
      Alert.alert(
        "Microphone Error",
        "Could not activate microphone: " +
          (err?.message || "Check device settings")
      );
      setIsRecording(false);
    }
  }, [loading, isTranscribing, send]);

  // ── Voice Command Handler: Stop & Transcribe via Whisper ──
  const handleStopAndSendVoice = useCallback(async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // If web speech recognition is active, stop it
    if (webRecognitionRef.current) {
      try {
        webRecognitionRef.current.stop();
      } catch {}
    }

    const recording = recordingRef.current;
    if (!recording) {
      setIsRecording(false);
      return;
    }

    recordingRef.current = null;
    setIsRecording(false);
    setIsTranscribing(true);

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (!uri) throw new Error("No recording audio found.");

      const formData = new FormData();
      if (Platform.OS === "web") {
        const resp = await fetch(uri);
        const blob = await resp.blob();
        (formData as any).append("file", blob, "voice.m4a");
      } else {
        formData.append("file", {
          uri,
          type: "audio/m4a",
          name: "voice.m4a",
        } as any);
      }
      formData.append("model", "whisper-large-v3");
      formData.append("language", "en");

      const whisperResp = await fetch(
        "https://api.groq.com/openai/v1/audio/transcriptions",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
          body: formData,
        }
      );

      if (!whisperResp.ok) {
        throw new Error(`Whisper transcription error (${whisperResp.status})`);
      }

      const data = await whisperResp.json();
      const transcript = (data.text || "").trim();

      if (transcript) {
        send(transcript);
      } else {
        setMessages(p => [
          ...p,
          {
            id: "sys" + Date.now(),
            role: "bot",
            timestamp: new Date(),
            text: "⚠️ Didn't catch that voice command. Please speak closer to your microphone and try again.",
          },
        ]);
      }
    } catch (err: any) {
      console.error("Transcription error:", err);
      setMessages(p => [
        ...p,
        {
          id: "sys" + Date.now(),
          role: "bot",
          timestamp: new Date(),
          text: `⚠️ Voice transcription failed: ${
            err?.message || "Could not process audio"
          }`,
        },
      ]);
    } finally {
      setIsTranscribing(false);
    }
  }, [send]);

  // Cancel Recording
  const handleCancelVoice = useCallback(async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (webRecognitionRef.current) {
      try {
        webRecognitionRef.current.abort();
      } catch {}
    }
    const recording = recordingRef.current;
    recordingRef.current = null;
    setIsRecording(false);
    if (recording) {
      try {
        await recording.stopAndUnloadAsync();
      } catch {}
    }
  }, []);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0b0f19" />

      {/* ── Header with Back, Title, History & New Chat ── */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={17} color="#38bdf8" />
          <Text style={s.backTxt}>Back</Text>
        </TouchableOpacity>

        <View style={[s.row, { gap: 8 }]}>
          <View style={s.hdrAv}>
            <Ionicons name="sparkles" size={15} color="#06b6d4" />
          </View>
          <View>
            <Text style={s.hdrTitle}>SmartEV AI</Text>
            <View style={[s.row, { gap: 4 }]}>
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: "#10b981",
                }}
              />
              <Text
                style={{ color: "#10b981", fontSize: 10, fontWeight: "600" }}
              >
                RAG + Voice Active
              </Text>
            </View>
          </View>
        </View>

        <View style={[s.row, { gap: 6 }]}>
          <TouchableOpacity
            style={[s.certBtn, isGeneratingPdf && { opacity: 0.6 }]}
            onPress={() => handleGeneratePDF("EV-001")}
            disabled={isGeneratingPdf}
          >
            {isGeneratingPdf ? (
              <ActivityIndicator size="small" color="#10b981" />
            ) : (
              <Ionicons name="document-text-outline" size={13} color="#10b981" />
            )}
            <Text style={s.certBtnTxt}>
              {isGeneratingPdf ? "PDF..." : "PDF Cert"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.historyBtn}
            onPress={() => setHistoryVisible(true)}
          >
            <Ionicons name="time-outline" size={14} color="#38bdf8" />
            <Text style={s.historyBtnTxt}>
              History ({allSessions.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.newBtn} onPress={newSession}>
            <Ionicons name="add" size={14} color="#0b0f19" />
            <Text style={s.newBtnTxt}>New</Text>
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Resumed from history banner */}
        {continuedBanner && (
          <View style={s.resumedBanner}>
            <Ionicons name="refresh" size={14} color="#06b6d4" />
            <Text style={s.resumedTxt}>
              Resumed conversation from history!
            </Text>
          </View>
        )}

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={m => m.id}
          contentContainerStyle={{ padding: 14, paddingBottom: 8 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Bubble
              msg={item}
              onChip={send}
              onGeneratePDF={() => handleGeneratePDF("EV-001")}
            />
          )}
          ListFooterComponent={loading ? <TypingIndicator /> : null}
          onContentSizeChange={scroll}
        />

        {/* ── Active Voice Recording Banner ── */}
        {isRecording && (
          <View style={s.recordingBanner}>
            <View style={[s.row, { gap: 8, flex: 1 }]}>
              <MicWaveform active={true} />
              <View>
                <Text style={s.recordingTitle}>
                  Listening... ({Math.floor(recordSeconds / 60)}:
                  {(recordSeconds % 60).toString().padStart(2, "0")})
                </Text>
                <Text style={s.recordingSub}>Speak your EV query clearly</Text>
              </View>
            </View>
            <View style={[s.row, { gap: 8 }]}>
              <TouchableOpacity
                onPress={handleCancelVoice}
                style={s.cancelVoiceBtn}
              >
                <Text style={s.cancelVoiceTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleStopAndSendVoice}
                style={s.sendVoiceBtn}
              >
                <Ionicons name="send" size={12} color="#fff" />
                <Text style={s.sendVoiceTxt}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Transcribing voice banner ── */}
        {isTranscribing && (
          <View style={s.transcribeBanner}>
            <ActivityIndicator size="small" color="#06b6d4" />
            <Text style={s.transcribeTxt}>
              Transcribing voice command with Whisper AI...
            </Text>
          </View>
        )}

        {/* ── Input bar with Mic and Send buttons ── */}
        <View style={s.inputBar}>
          <TextInput
            style={s.input}
            value={input}
            onChangeText={setInput}
            placeholder={
              isRecording
                ? "Recording voice command..."
                : isTranscribing
                ? "Transcribing voice..."
                : "Ask about your EV or tap 🎙️..."
            }
            placeholderTextColor="#4b5563"
            multiline
            maxLength={500}
            returnKeyType="send"
            editable={!isRecording && !isTranscribing}
            onSubmitEditing={() => send(input)}
          />

          {/* 🎙️ Voice command button */}
          <TouchableOpacity
            style={[
              s.micBtn,
              isRecording && { backgroundColor: "#ef4444", borderColor: "#ef4444" },
            ]}
            onPress={() => {
              if (isRecording) {
                handleStopAndSendVoice();
              } else {
                handleStartVoice();
              }
            }}
            disabled={loading || isTranscribing}
          >
            {isTranscribing ? (
              <ActivityIndicator size="small" color="#06b6d4" />
            ) : isRecording ? (
              <Ionicons name="stop" size={18} color="#fff" />
            ) : (
              <Ionicons name="mic" size={20} color="#06b6d4" />
            )}
          </TouchableOpacity>

          {/* ➤ Send button */}
          <TouchableOpacity
            style={[
              s.sendBtn,
              (!input.trim() || loading || isRecording) && { opacity: 0.4 },
            ]}
            onPress={() => send(input)}
            disabled={!input.trim() || loading || isRecording}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#0b0f19" />
            ) : (
              <Ionicons name="send" size={17} color="#0b0f19" />
            )}
          </TouchableOpacity>
        </View>

        {/* ── Voice Output (TTS) control pill row ── */}
        <View style={s.bottomRow}>
          <TouchableOpacity
            onPress={() => {
              if (voiceOutputOn) Speech.stop();
              setVoiceOutputOn(v => !v);
            }}
            style={[
              s.ttsPill,
              voiceOutputOn
                ? { backgroundColor: "rgba(6,182,212,0.15)", borderColor: "rgba(6,182,212,0.4)" }
                : { backgroundColor: "#182236", borderColor: "#23324d" },
            ]}
          >
            <Ionicons
              name={voiceOutputOn ? "volume-high" : "volume-mute"}
              size={13}
              color={voiceOutputOn ? "#06b6d4" : "#64748b"}
            />
            <Text
              style={{
                color: voiceOutputOn ? "#38bdf8" : "#64748b",
                fontSize: 11,
                fontWeight: "600",
              }}
            >
              {voiceOutputOn ? "Spoken Replies: ON" : "Spoken Replies: OFF"}
            </Text>
          </TouchableOpacity>

          <Text style={{ color: "#475569", fontSize: 10.5 }}>
            {isRecording
              ? "🔴 Tap ⏹️ to send audio"
              : "Tap 🎙️ to speak a question"}
          </Text>
        </View>
      </KeyboardAvoidingView>

      {/* ── Chat History Modal ── */}
      <HistoryModal
        visible={historyVisible}
        sessions={allSessions}
        activeSessionId={sessionId}
        onClose={() => setHistoryVisible(false)}
        onContinue={continueSession}
        onDeleteSession={deleteSession}
        onClearAll={clearAllHistory}
        onNewChat={newSession}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0b0f19" },
  row: { flexDirection: "row", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#131a2a",
    borderBottomWidth: 1,
    borderBottomColor: "#23324d",
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(6,182,212,0.12)",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  backTxt: { color: "#38bdf8", fontSize: 12.5, fontWeight: "600" },
  hdrAv: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(6,182,212,0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(6,182,212,0.3)",
  },
  hdrTitle: { color: "#f8fafc", fontSize: 13.5, fontWeight: "700" },
  certBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(16,185,129,0.12)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.4)",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  certBtnTxt: { color: "#10b981", fontSize: 11.5, fontWeight: "600" },
  historyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(6,182,212,0.12)",
    borderWidth: 1,
    borderColor: "rgba(6,182,212,0.35)",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
  },
  historyBtnTxt: { color: "#38bdf8", fontSize: 11.5, fontWeight: "600" },
  newBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#06b6d4",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  newBtnTxt: { color: "#0b0f19", fontSize: 11.5, fontWeight: "700" },

  resumedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(6,182,212,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(6,182,212,0.3)",
  },
  resumedTxt: { color: "#38bdf8", fontSize: 12, fontWeight: "600" },

  botAv: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(6,182,212,0.15)",
    borderWidth: 1,
    borderColor: "rgba(6,182,212,0.25)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    flexShrink: 0,
  },
  userAv: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#1e3a5f",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    flexShrink: 0,
  },
  bubble: {
    maxWidth: "80%",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  botBubble: {
    backgroundColor: "#182236",
    borderWidth: 1,
    borderColor: "#23324d",
    borderTopLeftRadius: 4,
  },
  userBubble: { backgroundColor: "#0e7490", borderTopRightRadius: 4 },
  bubbleTxt: { fontSize: 13.5, lineHeight: 20 },
  botTxt: { color: "#cbd5e1" },
  userTxt: { color: "#f0f9ff" },
  timeTxt: { fontSize: 9.5, color: "#64748b" },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeTxt: { fontSize: 9, fontWeight: "700" },
  chip: {
    backgroundColor: "rgba(6,182,212,0.1)",
    borderWidth: 1,
    borderColor: "rgba(6,182,212,0.3)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  chipTxt: { color: "#38bdf8", fontSize: 11.5, fontWeight: "600" },
  certCard: {
    backgroundColor: "#101a2e",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(6,182,212,0.35)",
    padding: 12,
    minWidth: 260,
  },
  certCardHdr: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#1e2e48",
    paddingBottom: 8,
    marginBottom: 10,
  },
  certCardHdrTxt: {
    color: "#10b981",
    fontSize: 11.5,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  certCardId: {
    color: "#64748b",
    fontSize: 9.5,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  certCardBody: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  certHeroLeft: {
    alignItems: "center",
    paddingRight: 12,
    borderRightWidth: 1,
    borderRightColor: "#1e2e48",
  },
  certHeroScore: {
    color: "#38bdf8",
    fontSize: 26,
    fontWeight: "900",
    lineHeight: 30,
  },
  certGradePill: {
    backgroundColor: "rgba(16,185,129,0.2)",
    borderWidth: 1,
    borderColor: "#10b981",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 2,
  },
  certGradePillTxt: {
    color: "#34d399",
    fontSize: 9.5,
    fontWeight: "800",
  },
  certHeroRight: {
    flex: 1,
    marginLeft: 12,
  },
  certCarTitle: {
    color: "#f8fafc",
    fontSize: 13,
    fontWeight: "700",
  },
  certCarSub: {
    color: "#94a3b8",
    fontSize: 11,
    marginTop: 2,
  },
  certBarTrack: {
    height: 6,
    backgroundColor: "#1e293b",
    borderRadius: 3,
    overflow: "hidden",
    marginTop: 6,
  },
  certBarFill: {
    height: "100%",
    backgroundColor: "#10b981",
    borderRadius: 3,
  },
  certForecastRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 10,
  },
  certForecastPill: {
    flex: 1,
    backgroundColor: "#0d1527",
    borderWidth: 1,
    borderColor: "#1e2e48",
    borderRadius: 6,
    paddingVertical: 6,
    alignItems: "center",
  },
  certForecastTitle: {
    color: "#64748b",
    fontSize: 9.5,
    fontWeight: "600",
  },
  certForecastVal: {
    color: "#f8fafc",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 2,
  },
  certMetricsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#0a1120",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 10,
  },
  certMetricItem: {
    color: "#94a3b8",
    fontSize: 10.5,
    fontWeight: "600",
  },
  certDownloadAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#10b981",
    borderRadius: 8,
    paddingVertical: 9,
  },
  certDownloadActionTxt: {
    color: "#0b0f19",
    fontSize: 12,
    fontWeight: "800",
  },
  sourcesBox: {
    marginLeft: 42,
    marginTop: 6,
    backgroundColor: "#0f1a2e",
    borderWidth: 1,
    borderColor: "#1e3a5f",
    borderRadius: 8,
    padding: 10,
    gap: 8,
  },
  sourceItem: {
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#1e3a5f",
  },
  srcTitle: { color: "#94a3b8", fontSize: 10, flex: 1 },
  srcScore: { color: "#475569", fontSize: 9 },
  srcText: { color: "#64748b", fontSize: 10.5, lineHeight: 14 },

  recordingBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 12,
    marginBottom: 8,
    backgroundColor: "rgba(239,68,68,0.12)",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.35)",
  },
  recordingTitle: { color: "#ef4444", fontSize: 12.5, fontWeight: "700" },
  recordingSub: { color: "#94a3b8", fontSize: 10 },
  cancelVoiceBtn: {
    backgroundColor: "#182236",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  cancelVoiceTxt: { color: "#94a3b8", fontSize: 11 },
  sendVoiceBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ef4444",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  sendVoiceTxt: { color: "#fff", fontSize: 11, fontWeight: "700" },

  transcribeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 12,
    marginBottom: 8,
    backgroundColor: "rgba(6,182,212,0.12)",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(6,182,212,0.3)",
  },
  transcribeTxt: { color: "#38bdf8", fontSize: 12 },

  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#23324d",
    backgroundColor: "#131a2a",
  },
  input: {
    flex: 1,
    backgroundColor: "#182236",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#23324d",
    paddingHorizontal: 14,
    paddingVertical: 9,
    color: "#f8fafc",
    fontSize: 14,
    maxHeight: 120,
  },
  micBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#182236",
    borderWidth: 1,
    borderColor: "rgba(6,182,212,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#06b6d4",
    justifyContent: "center",
    alignItems: "center",
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: "#131a2a",
    borderTopWidth: 1,
    borderTopColor: "#1e293b",
  },
  ttsPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#131a2a",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "88%",
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: "#23324d",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#23324d",
  },
  modalTitle: { color: "#f8fafc", fontSize: 16, fontWeight: "700" },
  newChatPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#06b6d4",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  newChatTxt: { color: "#0b0f19", fontSize: 11.5, fontWeight: "700" },
  closeBtn: { padding: 4 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#182236",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#23324d",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  searchInput: { flex: 1, color: "#f8fafc", fontSize: 13 },
  drillInHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#23324d",
  },
  drillInTitle: { color: "#f8fafc", fontSize: 14, fontWeight: "700" },
  trashBtn: {
    backgroundColor: "rgba(239,68,68,0.12)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.3)",
    borderRadius: 8,
    padding: 7,
  },
  continueBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#06b6d4",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  continueTxt: { color: "#0b0f19", fontSize: 12, fontWeight: "700" },
  historyCard: {
    backgroundColor: "#182236",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#23324d",
    padding: 12,
    marginBottom: 10,
  },
  activeBadge: {
    backgroundColor: "#06b6d4",
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  activeTxt: { color: "#0b0f19", fontSize: 9, fontWeight: "800" },
  historyPreview: { color: "#cbd5e1", fontSize: 12.5, lineHeight: 18 },
  cardContinueBtn: {
    backgroundColor: "rgba(6,182,212,0.15)",
    borderWidth: 1,
    borderColor: "rgba(6,182,212,0.4)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  cardContinueTxt: { color: "#38bdf8", fontSize: 11, fontWeight: "600" },
  drillInBubble: {
    maxWidth: "85%",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
