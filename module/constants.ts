import { Platform } from 'react-native';

export const JOY_SIZE   = 130;
export const THUMB_SIZE = 44;
export const JOY_RADIUS = JOY_SIZE / 2 - 18;

export const MONO = Platform.OS === 'ios' ? 'Courier' : 'monospace';

export const COLOR = {
  bg:          '#0b0d14',
  surface:     '#111520',
  surfaceAlt:  '#161a24',
  surfaceCard: '#1c2232',
  green:       '#1D9E75',
  greenLight:  '#5DCAA5',
  greenPale:   '#9FE1CB',
  greenArmed:  '#0F6E56',
  grid:        'rgba(29,158,117,0.05)',
  border:      'rgba(255,255,255,0.07)',
  borderArmed: 'rgba(255,255,255,0.12)',
  textDim:     'rgba(255,255,255,0.22)',
  textHud:     'rgba(255,255,255,0.28)',
} as const;
