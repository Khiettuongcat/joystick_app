/**
 * SettingsModal.tsx
 * Dùng useBLE hook — tự hoạt động trên cả Expo Go (mock) lẫn Dev Build (thật)
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Platform,
} from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import { COLOR, MONO } from '../constants';
import { useBLE, BLEDevice } from '../useble';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function SettingsModal({ visible, onClose }: SettingsModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const {
    bleState,
    scanning,
    devices,
    connectState,
    connectedName,
    errorMsg,
    startScan,
    stopScan,
    connect,
    disconnect,
  } = useBLE();

  // Lock portrait khi mở, trả landscape khi đóng
  useEffect(() => {
    if (visible) {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    } else {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      stopScan();
    }
  }, [visible]);

  const handleClose = () => {
    stopScan();
    onClose();
  };

  const handleConnectPress = async () => {
    if (!selectedId) return;
    if (connectState === 'connected') {
      await disconnect();
      setSelectedId(null);
    } else {
      await connect(selectedId);
    }
  };

  const connectLabel = () => {
    if (connectState === 'connecting') return 'Đang kết nối...';
    if (connectState === 'connected')  return 'Ngắt kết nối';
    if (connectState === 'error')      return 'Thử lại';
    return 'Kết nối';
  };

  const connectDisabled = !selectedId || connectState === 'connecting';

  const bleInfo = () => {
    if (bleState === 'PoweredOn')  return { text: 'BLE bật',  color: COLOR.green };
    if (bleState === 'PoweredOff') return { text: 'BLE tắt',  color: '#E74C3C' };
    return { text: `BLE: ${bleState}`, color: COLOR.textDim };
  };

  const renderDevice = ({ item }: { item: BLEDevice }) => {
    const selected    = item.id === selectedId;
    const isConnected = connectState === 'connected' && item.id === selectedId;
    const rssi        = item.rssi ?? -100;
    const signal      = rssi > -60 ? 'Mạnh' : rssi > -75 ? 'TB' : 'Yếu';
    const sigColor    = rssi > -60 ? COLOR.green : rssi > -75 ? '#F39C12' : '#E74C3C';

    return (
      <TouchableOpacity
        style={[styles.deviceRow, selected && styles.deviceRowSelected]}
        onPress={() => {
          setSelectedId(item.id);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.deviceLeft}>
          <Text style={styles.bleIcon}>{'◈'}</Text>
          <View style={styles.deviceInfo}>
            <Text style={styles.deviceName} numberOfLines={1}>
              {item.name ?? 'Unknown Device'}
            </Text>
            <Text style={styles.deviceId} numberOfLines={1}>{item.id}</Text>
          </View>
        </View>

        <View style={styles.deviceRight}>
          {isConnected && (
            <View style={styles.connectedPill}>
              <Text style={styles.connectedPillTxt}>{'CONNECTED'}</Text>
            </View>
          )}
          <Text style={[styles.rssiVal, { color: sigColor }]}>
            {item.rssi ?? '--'} dBm
          </Text>
          <Text style={[styles.rssiUnit, { color: sigColor }]}>{signal}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const info = bleInfo();

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
      hardwareAccelerated
    >
      <SafeAreaView style={styles.screen}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn} activeOpacity={0.7}>
            <Text style={styles.closeIcon}>{'✕'}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{'Cài đặt'}</Text>
          <View style={styles.bleStateBadge}>
            <View style={[styles.bleStateDot, { backgroundColor: info.color }]} />
            <Text style={[styles.bleStateTxt, { color: info.color }]}>{info.text}</Text>
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.sectionLabel}>{'KẾT NỐI BLUETOOTH'}</Text>

          {/* Connected badge */}
          {connectState === 'connected' && (
            <View style={styles.connectedBadge}>
              <View style={styles.connectedDot} />
              <Text style={styles.connectedTxt}>
                {'Đang kết nối: '}
                <Text style={styles.connectedName}>{connectedName}</Text>
              </Text>
            </View>
          )}

          {/* Error / info */}
          {errorMsg ? (
            <View style={styles.infoBox}>
              <Text style={styles.infoTxt}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* Scan button */}
          <TouchableOpacity
            style={[styles.scanBtn, scanning && styles.scanBtnActive]}
            onPress={scanning ? stopScan : startScan}
            activeOpacity={0.8}
          >
            {scanning && (
              <ActivityIndicator size="small" color={COLOR.green} style={{ marginRight: 8 }} />
            )}
            <Text style={styles.scanBtnTxt}>
              {scanning ? 'Dừng quét' : 'Quét thiết bị BLE'}
            </Text>
          </TouchableOpacity>

          {devices.length > 0 && (
            <Text style={styles.deviceCount}>{`Tìm thấy ${devices.length} thiết bị`}</Text>
          )}

          {/* Device list */}
          {devices.length === 0 && !scanning ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyIcon}>{'◎'}</Text>
              <Text style={styles.emptyTxt}>
                {'Chưa tìm thấy thiết bị.\nNhấn "Quét thiết bị BLE" để bắt đầu.'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={devices}
              keyExtractor={d => d.id}
              renderItem={renderDevice}
              style={styles.list}
              contentContainerStyle={{ gap: 8, paddingBottom: 8 }}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        {/* Footer connect button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.connectBtn,
              connectDisabled              && styles.connectBtnDisabled,
              connectState === 'connected' && styles.connectBtnDisconnect,
              connectState === 'error'     && styles.connectBtnError,
            ]}
            onPress={handleConnectPress}
            disabled={connectDisabled}
            activeOpacity={0.8}
          >
            {connectState === 'connecting' && (
              <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
            )}
            <Text style={styles.connectBtnTxt}>{connectLabel()}</Text>
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0b0d14',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(29,158,117,0.12)',
    gap: 12,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', justifyContent: 'center',
  },
  closeIcon: { fontSize: 14, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
  title: {
    flex: 1, fontSize: 17, fontWeight: '700',
    color: '#fff', fontFamily: MONO, letterSpacing: 0.5,
  },
  bleStateBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  },
  bleStateDot: { width: 6, height: 6, borderRadius: 3 },
  bleStateTxt: { fontSize: 10, fontFamily: MONO },

  body: { flex: 1, padding: 16, gap: 12 },

  sectionLabel: {
    fontSize: 10, letterSpacing: 2,
    color: 'rgba(255,255,255,0.25)', fontFamily: MONO,
  },

  connectedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(29,158,117,0.1)',
    borderRadius: 10, borderWidth: 1,
    borderColor: 'rgba(29,158,117,0.3)',
    paddingHorizontal: 12, paddingVertical: 10,
  },
  connectedDot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: COLOR.green },
  connectedTxt:  { fontSize: 13, color: 'rgba(255,255,255,0.6)', fontFamily: MONO },
  connectedName: { color: COLOR.greenLight, fontWeight: '700' },

  infoBox: {
    backgroundColor: 'rgba(243,156,18,0.08)',
    borderRadius: 8, borderWidth: 1,
    borderColor: 'rgba(243,156,18,0.25)',
    paddingHorizontal: 12, paddingVertical: 8,
  },
  infoTxt: { fontSize: 11, color: '#F39C12', fontFamily: MONO },

  scanBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 44, borderRadius: 12, borderWidth: 1,
    borderColor: COLOR.green, backgroundColor: 'rgba(29,158,117,0.08)',
  },
  scanBtnActive: {
    borderColor: 'rgba(29,158,117,0.35)',
    backgroundColor: 'rgba(29,158,117,0.04)',
  },
  scanBtnTxt: { fontSize: 13, color: COLOR.green, fontFamily: MONO, letterSpacing: 0.5 },

  deviceCount: {
    fontSize: 10, color: 'rgba(255,255,255,0.3)',
    fontFamily: MONO, letterSpacing: 1,
  },

  list: { flex: 1 },

  deviceRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 14, paddingVertical: 12,
  },
  deviceRowSelected: {
    borderColor: COLOR.green,
    backgroundColor: 'rgba(29,158,117,0.08)',
  },
  deviceLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  bleIcon:     { fontSize: 20, color: 'rgba(29,158,117,0.5)' },
  deviceInfo:  { flex: 1 },
  deviceName:  { fontSize: 14, color: '#fff', fontWeight: '600' },
  deviceId:    { fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: MONO, marginTop: 2 },
  deviceRight: { alignItems: 'flex-end', gap: 2, marginLeft: 8 },

  connectedPill: {
    backgroundColor: 'rgba(29,158,117,0.2)',
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2,
    borderWidth: 1, borderColor: COLOR.green, marginBottom: 2,
  },
  connectedPillTxt: { fontSize: 8, color: COLOR.green, fontFamily: MONO, fontWeight: '700' },

  rssiVal:  { fontSize: 12, fontFamily: MONO },
  rssiUnit: { fontSize: 10, fontFamily: MONO },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyIcon: { fontSize: 40, color: 'rgba(29,158,117,0.2)' },
  emptyTxt: {
    fontSize: 13, color: 'rgba(255,255,255,0.25)',
    textAlign: 'center', lineHeight: 22, fontFamily: MONO,
  },

  footer: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(29,158,117,0.1)',
  },
  connectBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 50, borderRadius: 12, backgroundColor: COLOR.green,
  },
  connectBtnDisabled:   { backgroundColor: 'rgba(29,158,117,0.2)' },
  connectBtnDisconnect: { backgroundColor: '#8B2020', borderWidth: 1, borderColor: '#C0392B' },
  connectBtnError:      { backgroundColor: '#7A4500', borderWidth: 1, borderColor: '#E67E22' },
  connectBtnTxt: {
    fontSize: 14, fontWeight: '700',
    color: '#fff', fontFamily: MONO, letterSpacing: 0.5,
  },
});