import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { COLOR } from '../constants';

export function GridBackground() {
  const win = Dimensions.get('window');
  const W   = Math.max(win.width, win.height);
  const H   = Math.min(win.width, win.height);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: Math.ceil(H / 32) + 1 }).map((_, i) => (
        <View key={`h${i}`} style={[styles.line, styles.horizontal, { top: i * 32 }]} />
      ))}
      {Array.from({ length: Math.ceil(W / 32) + 1 }).map((_, i) => (
        <View key={`v${i}`} style={[styles.line, styles.vertical, { left: i * 32 }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  line:       { position: 'absolute', backgroundColor: COLOR.grid },
  horizontal: { left: 0, right: 0, height: StyleSheet.hairlineWidth },
  vertical:   { top: 0, bottom: 0, width: StyleSheet.hairlineWidth },
});
