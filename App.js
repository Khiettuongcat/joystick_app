/**
 * App.tsx — entry point
 * GestureHandlerRootView bắt buộc phải wrap ngoài cùng
 * để react-native-gesture-handler hoạt động đúng
 */

import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import DroneController from './src/DroneController';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <DroneController />
    </GestureHandlerRootView>
  );
}