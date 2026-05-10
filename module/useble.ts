/**
 * useBLE.ts
 * 
 * Wrapper BLE — tự detect Expo Go vs Dev Build:
 * - Expo Go        → mock data (không crash)
 * - Dev Build      → react-native-ble-plx thật
 *
 * Build dev app:
 *   npx expo install react-native-ble-plx expo-dev-client
 *   npx expo prebuild
 *   npx expo run:ios   hoặc   npx expo run:android
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export interface BLEDevice {
  id:   string;
  name: string | null;
  rssi: number | null;
}

export type BLEConnectState = 'idle' | 'connecting' | 'connected' | 'error';
export type BLEState        = 'PoweredOn' | 'PoweredOff' | 'Unknown' | 'Unsupported';

export interface UseBLEResult {
  bleState:     BLEState;
  scanning:     boolean;
  devices:      BLEDevice[];
  connectState: BLEConnectState;
  connectedName: string | null;
  errorMsg:     string | null;
  startScan:    () => void;
  stopScan:     () => void;
  connect:      (id: string) => Promise<void>;
  disconnect:   () => Promise<void>;
}

// ── Detect nếu native module tồn tại ─────────────────────────────────────────
function isNativeAvailable(): boolean {
  try {
    // Thử require — nếu native module không có sẽ throw
    const { BleManager } = require('react-native-ble-plx');
    new BleManager();
    return true;
  } catch {
    return false;
  }
}

// ── MOCK hook (Expo Go) ───────────────────────────────────────────────────────
function useBLEMock(): UseBLEResult {
  const [scanning, setScanning]         = useState(false);
  const [devices, setDevices]           = useState<BLEDevice[]>([]);
  const [connectState, setConnectState] = useState<BLEConnectState>('idle');
  const [connectedName, setConnectedName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg]         = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const MOCK_DEVICES: BLEDevice[] = [
    { id: 'AA:BB:CC:DD:EE:01', name: 'Drone-FC-01', rssi: -52 },
    { id: 'AA:BB:CC:DD:EE:02', name: 'Drone-FC-02', rssi: -68 },
    { id: 'AA:BB:CC:DD:EE:03', name: 'FC-Mini-X3',  rssi: -74 },
    { id: 'AA:BB:CC:DD:EE:04', name: null,           rssi: -89 },
  ];

  const startScan = useCallback(() => {
    setScanning(true);
    setDevices([]);
    setErrorMsg('[Expo Go] Đang dùng mock data — build dev app để scan BLE thật');
    let i = 0;
    const addNext = () => {
      if (i >= MOCK_DEVICES.length) { setScanning(false); return; }
      setDevices(prev => [...prev, MOCK_DEVICES[i++]]);
      timer.current = setTimeout(addNext, 700);
    };
    timer.current = setTimeout(addNext, 500);
  }, []);

  const stopScan = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setScanning(false);
  }, []);

  const connect = useCallback(async (id: string) => {
    setConnectState('connecting');
    setErrorMsg(null);
    await new Promise(r => setTimeout(r, 1200));
    const dev = MOCK_DEVICES.find(d => d.id === id);
    setConnectedName(dev?.name ?? id);
    setConnectState('connected');
  }, []);

  const disconnect = useCallback(async () => {
    setConnectState('idle');
    setConnectedName(null);
  }, []);

  return {
    bleState: 'PoweredOn',
    scanning,
    devices,
    connectState,
    connectedName,
    errorMsg,
    startScan,
    stopScan,
    connect,
    disconnect,
  };
}

// ── REAL hook (Dev Build) ─────────────────────────────────────────────────────
function useBLEReal(): UseBLEResult {
  const { BleManager, State } = require('react-native-ble-plx');

  const [bleState, setBleState]           = useState<BLEState>('Unknown');
  const [scanning, setScanning]           = useState(false);
  const [devices, setDevices]             = useState<BLEDevice[]>([]);
  const [connectState, setConnectState]   = useState<BLEConnectState>('idle');
  const [connectedName, setConnectedName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg]           = useState<string | null>(null);

  const managerRef       = useRef<any>(null);
  const connectedDevRef  = useRef<any>(null);
  const scanTimer        = useRef<ReturnType<typeof setTimeout> | null>(null);
  const foundDevices     = useRef(new Map<string, BLEDevice>());

  useEffect(() => {
    managerRef.current = new BleManager();
    const sub = managerRef.current.onStateChange((s: string) => {
      setBleState(s as BLEState);
    }, true);
    return () => {
      sub.remove();
      managerRef.current?.destroy();
    };
  }, []);

  const stopScan = useCallback(() => {
    managerRef.current?.stopDeviceScan();
    setScanning(false);
    if (scanTimer.current) { clearTimeout(scanTimer.current); scanTimer.current = null; }
  }, []);

  const startScan = useCallback(() => {
    if (bleState !== 'PoweredOn') {
      setErrorMsg('Bluetooth chưa bật. Vui lòng bật Bluetooth.');
      return;
    }
    setErrorMsg(null);
    setScanning(true);
    setDevices([]);
    foundDevices.current.clear();

    managerRef.current?.startDeviceScan(
      null,
      { allowDuplicates: false },
      (error: any, device: any) => {
        if (error) { setErrorMsg(`Lỗi: ${error.message}`); stopScan(); return; }
        if (!device) return;

        const entry: BLEDevice = {
          id:   device.id,
          name: device.name ?? device.localName ?? null,
          rssi: device.rssi,
        };
        foundDevices.current.set(entry.id, entry);
        const sorted = [...foundDevices.current.values()]
          .sort((a, b) => (b.rssi ?? -999) - (a.rssi ?? -999));
        setDevices(sorted);
      }
    );

    scanTimer.current = setTimeout(() => stopScan(), 8000);
  }, [bleState, stopScan]);

  const connect = useCallback(async (id: string) => {
    setConnectState('connecting');
    setErrorMsg(null);
    try {
      const device = await managerRef.current.connectToDevice(id);
      await device.discoverAllServicesAndCharacteristics();
      connectedDevRef.current = device;
      device.onDisconnected(() => {
        setConnectState('idle');
        setConnectedName(null);
        connectedDevRef.current = null;
      });
      setConnectedName(device.name ?? device.localName ?? id);
      setConnectState('connected');
    } catch (e: any) {
      setErrorMsg(`Kết nối thất bại: ${e?.message ?? 'Unknown'}`);
      setConnectState('error');
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      if (connectedDevRef.current) {
        await managerRef.current?.cancelDeviceConnection(connectedDevRef.current.id);
      }
    } catch { /* ignore */ }
    connectedDevRef.current = null;
    setConnectState('idle');
    setConnectedName(null);
  }, []);

  return { bleState, scanning, devices, connectState, connectedName, errorMsg, startScan, stopScan, connect, disconnect };
}

// ── Export: tự chọn mock hay real ────────────────────────────────────────────
const USE_REAL = isNativeAvailable();

export function useBLE(): UseBLEResult {
  // Gọi cả 2 hook nhưng chỉ dùng 1 — React hooks rule: không gọi conditionally
  const mock = useBLEMock();
  const real = USE_REAL ? useBLEReal() : null;
  return USE_REAL && real ? real : mock;
}