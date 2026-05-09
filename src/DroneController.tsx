/**
 * DroneController.tsx — màn hình chính
 *
 * Install:
 *   npx expo install expo-screen-orientation
 */

import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, StatusBar } from 'react-native';

import { useLandscape } from '../module/useLandscape'; 
import { useDroneLoop } from '../module/useDroneLoop'; 
import { GridBackground } from '../module/ui/GridBackground'; 
import { ArmButton } from '../module/ui/ArmButton'; 
import { HudBar } from '../module/ui/HudBar'; 
import { Joystick } from '../module/ui/Joystick'; 
import { COLOR } from '../module/constants'; 
import { SettingsModal } from '../module/ui/SettingsModal';

export default function DroneController() {
  useLandscape();

  const [armed, setArmed] = useState(false);
  const [hud, setHud] = useState({ alt: 0, spd: 0, yaw: 0, thr: 0 });
  const [settingsOpen, setSettings] = useState(false);

  const jvL = useRef({ x: 0, y: 0 });
  const jvR = useRef({ x: 0, y: 0 });

  const joyOpacity = useRef(new Animated.Value(0)).current;
  const joyTranslate = useRef(new Animated.Value(30)).current;

  const { start: startLoop, stop: stopLoop } = useDroneLoop({
    jvL,
    jvR,
    onTick: setHud,
  });

  const showJoysticks = () => {
    Animated.parallel([
      Animated.timing(joyOpacity, { toValue: 1, duration: 260, useNativeDriver: true }),
      Animated.spring(joyTranslate, { toValue: 0, friction: 6, useNativeDriver: true }),
    ]).start();
  };

  const hideJoysticks = () => {
    Animated.parallel([
      Animated.timing(joyOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(joyTranslate, { toValue: 30, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  const handleToggle = () => {
    const next = !armed;
    setArmed(next);
    if (next) {
      showJoysticks();
      startLoop();
    } else {
      hideJoysticks();
      stopLoop();
      jvL.current = { x: 0, y: 0 };
      jvR.current = { x: 0, y: 0 };
      setHud(prev => ({ ...prev, spd: 0, yaw: 0, thr: 0 }));
    }
  };

  useEffect(() => () => stopLoop(), []);

  return (
    <View style={styles.screen}>
      <StatusBar hidden />

      <GridBackground />

      {/* Top bar */}
      <View style={styles.topBar}>
        <ArmButton
          armed={armed}
          onPress={handleToggle}
          onSettingsPress={() => setSettings(true)}
        />
        <HudBar hud={hud} opacity={joyOpacity} />
      </View>

      {/* Joysticks */}
      <Animated.View
        style={[
          styles.joystickRow,
          { opacity: joyOpacity, transform: [{ translateY: joyTranslate }] },
        ]}
        pointerEvents={armed ? 'box-none' : 'none'}
      >
        <Joystick
          label="YAW · THR"
          snapOnRelease={true}
          onValue={(x, y) => { jvL.current = { x, y }; }}
        />
        <Joystick
          label="PITCH · ROLL"
          snapOnRelease={true}
          onValue={(x, y) => { jvR.current = { x, y }; }}
        />
      </Animated.View>

      {/* Settings Modal */}
      <SettingsModal
        visible={settingsOpen}
        onClose={() => setSettings(false)}
      // bleManager={yourBleManagerInstance} ← truyền vào khi có BLE thật
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLOR.bg,
  },
  topBar: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  joystickRow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 175,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 14,
  },
});