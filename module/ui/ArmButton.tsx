import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { COLOR } from '../constants';

interface ArmButtonProps {
  armed: boolean;
  onPress: () => void;
  onSettingsPress: () => void;
}

export function ArmButton({ armed, onPress, onSettingsPress }: ArmButtonProps) {
  return (
    <View style={styles.group}>

      {/* Nút ARM */}
      <TouchableOpacity
        style={[styles.btn, armed && styles.btnArmed]}
        onPress={onPress}
        activeOpacity={0.75}
      >
        {armed && <View style={styles.pulse} />}
        <Text style={[styles.icon, armed && styles.iconArmed]}>{'✦'}</Text>
      </TouchableOpacity>

      {/* Nút Settings */}
      <TouchableOpacity
        style={styles.btn}
        onPress={onSettingsPress}
        activeOpacity={0.75}
      >
        <Text style={styles.icon}>{'⚙'}</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLOR.surfaceAlt,
    borderWidth: 1.5,
    borderColor: COLOR.borderArmed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnArmed: {
    backgroundColor: COLOR.greenArmed,
    borderColor: COLOR.green,
  },
  pulse: {
    position: 'absolute',
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1.5,
    borderColor: COLOR.green,
    opacity: 0.3,
    top: -5,
    left: -5,
  },
  icon: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.3)',
  },
  iconArmed: {
    color: COLOR.greenPale,
  },
});