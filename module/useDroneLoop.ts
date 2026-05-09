import { useRef, useEffect } from 'react';

export interface HudState {
  alt: number;
  spd: number;
  yaw: number;
  thr: number;
}

export interface JoystickValues {
  x: number;
  y: number;
}

interface UseDroneLoopProps {
  jvL: React.MutableRefObject<JoystickValues>;
  jvR: React.MutableRefObject<JoystickValues>;
  onTick: (hud: HudState) => void;
}

export function useDroneLoop({ jvL, jvR, onTick }: UseDroneLoopProps) {
  const altRef  = useRef(0);
  const loopRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = () => {
    if (loopRef.current) clearInterval(loopRef.current);
    loopRef.current = null;
  };

  const start = () => {
    stop();
    loopRef.current = setInterval(() => {
      // kéo lên (y âm) → tăng ALT, kéo xuống → giảm
      altRef.current = Math.max(0, altRef.current - jvL.current.y * 0.08);

      const spd = Math.sqrt(jvR.current.x ** 2 + jvR.current.y ** 2) * 7;
      const yaw = Math.round(jvL.current.x * 100);
      const thr = Math.round(-jvL.current.y * 100);

      console.log(
        `[DRONE] L(x:${jvL.current.x.toFixed(2)} y:${jvL.current.y.toFixed(2)})` +
        ` R(x:${jvR.current.x.toFixed(2)} y:${jvR.current.y.toFixed(2)})` +
        ` | ALT:${altRef.current.toFixed(1)}m YAW:${yaw} THR:${thr} SPD:${spd.toFixed(1)}`
      );

      onTick({ alt: altRef.current, spd, yaw, thr });
    }, 50);
  };

  // cleanup on unmount
  useEffect(() => () => stop(), []);

  return { start, stop, altRef };
}
