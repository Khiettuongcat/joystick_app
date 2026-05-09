/**
 * SettingsModal.tsx
 * Modal setting: scan BLE + connect
 *
 * Install:
 *   npx expo install react-native-ble-plx expo-location
 *   (react-native-ble-plx cần permissions trong app.json)
 */

import React, { useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { COLOR, MONO } from '../constants';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface BLEDevice {
  id: string;
  name: string | null;
  rssi: number | null;
}

type ConnectState = 'idle' | 'connecting' | 'connected' | 'error';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  // Truyền BleManager từ ngoài vào để dễ mock/test
  // Nếu chưa có BLE thì để undefined — UI vẫn render bình thường
  bleManager?: any;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function SettingsModal({ visible, onClose, bleManager }: SettingsModalProps) {
  const [scanning, setScanning]           = useState(false);
  const [devices, setDevices]             = useState<BLEDevice[]>([]);
  const [selectedId, setSelectedId]       = useState<string | null>(null);
  const [connectState, setConnectState]   = useState<ConnectState>('idle');
  const [connectedName, setConnectedName] = useState<string | null>(null);

  // ── Scan BLE ───────────────────────────────────────────────────────────────
  const handleScan = useCallback(() => {
    if (!bleManager) {
      // Không có BleManager — demo với dữ liệu giả
      setScanning(true);
      setDevices([]);
      setSelectedId(null);
      setConnectState('idle');
      setTimeout(() => {
        setDevices([
          { id: 'AA:BB:CC:DD:EE:01', name: 'Drone-FC-01', rssi: -55 },
          { id: 'AA:BB:CC:DD:EE:02', name: 'Drone-FC-02', rssi: -72 },
          { id: 'AA:BB:CC:DD:EE:03', name: null,          rssi: -88 },
        ]);
        setScanning(false);
      }, 2000);
      return;
    }

    setScanning(true);
    setDevices([]);
    setSelectedId(null);
    setConnectState('idle');

    const found = new Map<string, BLEDevice>();

    bleManager.startDeviceScan(null, null, (error: any, device: any) => {
      if (error) { setScanning(false); return; }
      if (!device) return;

      const d: BLEDevice = { id: device.id, name: device.name, rssi: device.rssi };
      found.set(d.id, d);
      setDevices([...found.values()]);
    });

    // Dừng scan sau 5 giây
    setTimeout(() => {
      bleManager.stopDeviceScan();
      setScanning(false);
    }, 5000);
  }, [bleManager]);

  // ── Connect ────────────────────────────────────────────────────────────────
  const handleConnect = useCallback(async () => {
    if (!selectedId) return;

    setConnectState('connecting');

    if (!bleManager) {
      // Demo — giả lập connect thành công
      setTimeout(() => {
        const dev = devices.find(d => d.id === selectedId);
        setConnectedName(dev?.name ?? selectedId);
        setConnectState('connected');
      }, 1500);
      return;
    }

    try {
      const device = await bleManager.connectToDevice(selectedId);
      await device.discoverAllServicesAndCharacteristics();
      setConnectedName(device.name ?? selectedId);
      setConnectState('connected');
    } catch {
      setConnectState('error');
    }
  }, [selectedId, bleManager, devices]);

  // ── Disconnect ─────────────────────────────────────────────────────────────
  const handleDisconnect = useCallback(() => {
    if (bleManager && selectedId) {
      bleManager.cancelDeviceConnection(selectedId).catch(() => {});
    }
    setConnectState('idle');
    setConnectedName(null);
    setSelectedId(null);
  }, [bleManager, selectedId]);

  // ── Render device row ──────────────────────────────────────────────────────
  const renderDevice = ({ item }: { item: BLEDevice }) => {
    const isSelected = item.id === selectedId;
    return (
      <TouchableOpacity
        style={[styles.deviceRow, isSelected && styles.deviceRowSelected]}
        onPress={() => {
          setSelectedId(item.id);
          setConnectState('idle');
        }}
        activeOpacity={0.7}
      >
        <View style={styles.deviceInfo}>
          <Text style={styles.deviceName}>{item.name ?? 'Unknown Device'}</Text>
          <Text style={styles.deviceId}>{item.id}</Text>
        </View>
        <View style={styles.rssiWrap}>
          <Text style={styles.rssiVal}>{item.rssi ?? '--'}</Text>
          <Text style={styles.rssiUnit}>{'dBm'}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // ── Connect button label ───────────────────────────────────────────────────
  const connectLabel = () => {
    if (connectState === 'connecting') return 'Đang kết nối...';
    if (connectState === 'connected')  return 'Ngắt kết nối';
    if (connectState === 'error')      return 'Thử lại';
    return 'Kết nối';
  };

  const connectDisabled = !selectedId || connectState === 'connecting';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{'⚙  Cài đặt'}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Text style={styles.closeIcon}>{'✕'}</Text>
            </TouchableOpacity>
          </View>

          {/* Section BLE */}
          <Text style={styles.sectionLabel}>{'BLUETOOTH'}</Text>

          {/* Connected badge */}
          {connectState === 'connected' && (
            <View style={styles.connectedBadge}>
              <View style={styles.connectedDot} />
              <Text style={styles.connectedTxt}>
                {'Đã kết nối: '}
                <Text style={styles.connectedName}>{connectedName}</Text>
              </Text>
            </View>
          )}

          {/* Scan button */}
          <TouchableOpacity
            style={[styles.scanBtn, scanning && styles.scanBtnActive]}
            onPress={handleScan}
            disabled={scanning}
            activeOpacity={0.8}
          >
            {scanning
              ? <ActivityIndicator size="small" color={COLOR.green} style={{ marginRight: 8 }} />
              : null
            }
            <Text style={styles.scanBtnTxt}>
              {scanning ? 'Đang quét...' : 'Quét thiết bị BLE'}
            </Text>
          </TouchableOpacity>

          {/* Device list */}
          {devices.length === 0 && !scanning
            ? (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyTxt}>{'Chưa tìm thấy thiết bị.\nNhấn "Quét" để bắt đầu.'}</Text>
              </View>
            )
            : (
              <FlatList
                data={devices}
                keyExtractor={d => d.id}
                renderItem={renderDevice}
                style={styles.list}
                contentContainerStyle={{ gap: 6 }}
              />
            )
          }

          {/* Connect / Disconnect button */}
          <TouchableOpacity
            style={[
              styles.connectBtn,
              connectDisabled && styles.connectBtnDisabled,
              connectState === 'connected' && styles.connectBtnDisconnect,
              connectState === 'error'     && styles.connectBtnError,
            ]}
            onPress={connectState === 'connected' ? handleDisconnect : handleConnect}
            disabled={connectDisabled}
            activeOpacity={0.8}
          >
            {connectState === 'connecting'
              ? <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
              : null
            }
            <Text style={styles.connectBtnTxt}>{connectLabel()}</Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheet: {
    width: 360,
    maxHeight: 480,
    backgroundColor: '#12161f',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(29,158,117,0.2)',
    padding: 20,
    gap: 12,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: COLOR.greenPale,
    fontFamily: MONO,
    letterSpacing: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
  },

  // Section label
  sectionLabel: {
    fontSize: 9,
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.25)',
    fontFamily: MONO,
  },

  // Connected badge
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(29,158,117,0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(29,158,117,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  connectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLOR.green,
  },
  connectedTxt: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    fontFamily: MONO,
  },
  connectedName: {
    color: COLOR.greenLight,
    fontWeight: '700',
  },

  // Scan button
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLOR.green,
    backgroundColor: 'rgba(29,158,117,0.08)',
  },
  scanBtnActive: {
    borderColor: 'rgba(29,158,117,0.3)',
    backgroundColor: 'rgba(29,158,117,0.04)',
  },
  scanBtnTxt: {
    fontSize: 12,
    color: COLOR.green,
    fontFamily: MONO,
    letterSpacing: 0.5,
  },

  // Device list
  list: {
    maxHeight: 180,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  deviceRowSelected: {
    borderColor: COLOR.green,
    backgroundColor: 'rgba(29,158,117,0.08)',
  },
  deviceInfo: { gap: 2 },
  deviceName: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
  },
  deviceId: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.3)',
    fontFamily: MONO,
  },
  rssiWrap: { alignItems: 'flex-end' },
  rssiVal:  { fontSize: 13, color: COLOR.greenLight, fontFamily: MONO },
  rssiUnit: { fontSize: 8,  color: 'rgba(255,255,255,0.3)', fontFamily: MONO },

  // Empty state
  emptyWrap: {
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTxt: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.25)',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: MONO,
  },

  // Connect button
  connectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 10,
    backgroundColor: COLOR.green,
  },
  connectBtnDisabled: {
    backgroundColor: 'rgba(29,158,117,0.2)',
  },
  connectBtnDisconnect: {
    backgroundColor: '#8B2020',
    borderWidth: 1,
    borderColor: '#C0392B',
  },
  connectBtnError: {
    backgroundColor: '#7A4500',
    borderWidth: 1,
    borderColor: '#E67E22',
  },
  connectBtnTxt: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    fontFamily: MONO,
    letterSpacing: 0.5,
  },
});