import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { HudState } from '../useDroneLoop';
import { COLOR, MONO } from '../constants';


interface HudBarProps {
  hud: HudState;
  opacity: Animated.Value;
}

const HUD_ITEMS = (hud: HudState) => [
  { label: 'ALT', value: `${hud.alt.toFixed(1)}m` },
  { label: 'SPD', value: hud.spd.toFixed(1) },
  { label: 'YAW', value: String(hud.yaw) },
  { label: 'THR', value: String(hud.thr) },
];

export function HudBar({ hud, opacity }: HudBarProps) {
  return (
    <Animated.View style={[styles.row, { opacity }]}>
      {HUD_ITEMS(hud).map(item => (
        <View key={item.label} style={styles.item}>
          <Text style={styles.label}>{item.label}</Text>
          <Text style={styles.value}>{item.value}</Text>
        </View>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  item: {
    alignItems: 'center',
  },
  label: {
    fontSize: 9,
    color: COLOR.textHud,
    letterSpacing: 1.5,
    fontFamily: MONO,
  },
  value: {
    fontSize: 13,
    fontWeight: '600',
    color: COLOR.greenLight,
    fontFamily: MONO,
  },
});
