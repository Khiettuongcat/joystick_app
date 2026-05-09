import { useEffect } from 'react';
import * as ScreenOrientation from 'expo-screen-orientation';

export function useLandscape() {
  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    return () => {
      ScreenOrientation.unlockAsync();
    };
  }, []);
}
