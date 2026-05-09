/**
 * Joystick.tsx
 *
 * Dùng react-native-gesture-handler để multi-touch hoạt động
 * nhất quán trên CẢ iOS lẫn Android.
 *
 * Install:
 *   npx expo install react-native-gesture-handler
 *
 * Bắt buộc wrap App trong GestureHandlerRootView:
 *   // App.tsx
 *   import { GestureHandlerRootView } from 'react-native-gesture-handler';
 *   export default function App() {
 *     return (
 *       <GestureHandlerRootView style={{ flex: 1 }}>
 *         <DroneController />
 *       </GestureHandlerRootView>
 *     );
 *   }
 */

import React, { useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { JOY_SIZE, JOY_RADIUS, THUMB_SIZE, COLOR, MONO } from '../constants';

interface JoystickProps {
  label: string;
  snapOnRelease?: boolean;
  onValue: (x: number, y: number) => void;
}

export const Joystick = React.memo(({
  label,
  snapOnRelease = true,
  onValue,
}: JoystickProps) => {
  const thumbX   = useRef(new Animated.Value(0)).current;
  const thumbY   = useRef(new Animated.Value(0)).current;
  const lastNorm = useRef({ x: 0, y: 0 });

  // Clamp offset trong vòng tròn JOY_RADIUS
  const clamp = (dx: number, dy: number) => {
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > JOY_RADIUS) {
      return { dx: dx / dist * JOY_RADIUS, dy: dy / dist * JOY_RADIUS };
    }
    return { dx, dy };
  };

  const applyMove = (rawDx: number, rawDy: number) => {
    const { dx, dy } = clamp(rawDx, rawDy);
    thumbX.setValue(dx);
    thumbY.setValue(dy);
    lastNorm.current = { x: dx / JOY_RADIUS, y: dy / JOY_RADIUS };
    onValue(lastNorm.current.x, lastNorm.current.y);
  };

  const applyRelease = () => {
    const toX = snapOnRelease ? 0 : lastNorm.current.x;
    Animated.spring(thumbX, { toValue: toX * JOY_RADIUS, useNativeDriver: false, friction: 5 }).start();
    Animated.spring(thumbY, { toValue: 0,                 useNativeDriver: false, friction: 5 }).start();
    lastNorm.current = { x: toX, y: 0 };
    onValue(toX, 0);
  };

  // Pan gesture — mỗi Joystick có gesture riêng, độc lập hoàn toàn
  // simultaneousWithExternalGesture không cần vì mỗi instance là 1 GestureDetector riêng
  const pan = Gesture.Pan()
    .runOnJS(true)                  // chạy callback trên JS thread để set state
    .minDistance(0)                 // kích hoạt ngay khi chạm
    .onBegin(() => {
      applyMove(0, 0);
    })
    .onUpdate((e) => {
      applyMove(e.translationX, e.translationY);
    })
    .onEnd(() => {
      applyRelease();
    })
    .onFinalize(() => {
      applyRelease();
    });

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <GestureDetector gesture={pan}>
        <View collapsable={false} style={styles.base}>
          <View style={styles.ring} />
          <View style={[styles.ch, styles.chH]} />
          <View style={[styles.ch, styles.chV]} />
          <Animated.View
            style={[
              styles.thumb,
              { transform: [{ translateX: thumbX }, { translateY: thumbY }] },
            ]}
          >
            <View style={styles.dot} />
          </Animated.View>
        </View>
      </GestureDetector>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontSize: 8,
    color: COLOR.textDim,
    letterSpacing: 2,
    fontFamily: MONO,
  },
  base: {
    width: JOY_SIZE,
    height: JOY_SIZE,
    borderRadius: JOY_SIZE / 2,
    backgroundColor: COLOR.surface,
    borderWidth: 1,
    borderColor: COLOR.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 1,
    borderColor: 'rgba(29,158,117,0.1)',
  },
  ch:  { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.04)' },
  chH: { width: '72%', height: StyleSheet.hairlineWidth },
  chV: { height: '72%', width: StyleSheet.hairlineWidth },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: COLOR.surfaceCard,
    borderWidth: 1.5,
    borderColor: COLOR.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: 'rgba(29,158,117,0.5)',
  },
});