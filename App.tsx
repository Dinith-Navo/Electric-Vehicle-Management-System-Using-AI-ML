// ─────────────────────────────────────────────────────────────────────────────
//  App.tsx  — Simplified (theme selector removed)
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { View, StyleSheet } from 'react-native';
import EVChatScreen from './screens/EVChatScreen.tsx';

export default function App() {
  return (
    <View style={styles.root}>
      <EVChatScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
