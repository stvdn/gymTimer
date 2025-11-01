// AnalogChronometer.tsx (chronometer with horizontal progress bar under the dial)
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, G, Line, Text as SvgText } from 'react-native-svg';

type Props = {
  size?: number;
  durationSec?: number; // if provided, the bar shows completion vs this target; else it loops per minute
};

export default function AnalogChronometer({ size = 220, durationSec }: Props) {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);

  const lastStartRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const baseAccumRef = useRef<number>(0);

  useEffect(() => {
    if (!isRunning) return; // Only run when timer is active

    const loop = () => {
      if (lastStartRef.current != null) {
        const now = Date.now();
        const runDelta = now - lastStartRef.current;
        setElapsedMs(baseAccumRef.current + runDelta);
      }
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isRunning]);

  const start = () => {
    if (isRunning) return;
    lastStartRef.current = Date.now();
    setIsRunning(true); // This will trigger the useEffect above
  };

  const pause = () => {
    if (!isRunning) return;
    if (lastStartRef.current != null) {
      baseAccumRef.current += Date.now() - lastStartRef.current;
    }
    lastStartRef.current = null;
    setIsRunning(false); // This will stop the useEffect loop
  };

  const reset = () => {
    setIsRunning(false);
    lastStartRef.current = null;
    baseAccumRef.current = 0;
    setElapsedMs(0);
  };

  // Geometry
  const r = size / 2;
  const cx = r;
  const cy = r;

  // Hand (seconds sweep)
  const secondsFloat = elapsedMs / 1000;
  const seconds = secondsFloat % 60;
  const secAngle = (seconds / 60) * 2 * Math.PI;
  const secLen = r * 0.78;

  const xAt = (angle: number, len: number) => cx + len * Math.sin(angle);
  const yAt = (angle: number, len: number) => cy - len * Math.cos(angle);

  // Ticks
  const tickLen = (i: number) => (i % 5 === 0 ? r * 0.12 : r * 0.06);

  // Numerals placed inside tick ring (closer to center)
  const labelBase = r * 0.72;
  const labelInset = r * 0.05; // increase to move labels further toward center
  const labelRadius = Math.max(0, Math.min(r, labelBase - labelInset));

  const secondLabels = useMemo(
    () =>
      Array.from({ length: 12 }, (_, idx) => {
        const sec = (idx + 1) * 5;
        const a = (sec / 60) * 2 * Math.PI;
        const x = xAt(a, labelRadius);
        const y = yAt(a, labelRadius) + r * 0.02;
        return { sec, x, y };
      }),
    [r, labelRadius]
  );

  // Progress bar values
  const progress01 =
    typeof durationSec === 'number' && durationSec > 0
      ? Math.min(1, elapsedMs / (durationSec * 1000))
      : (secondsFloat % 60) / 60;

  const progressPct = Math.max(0, Math.min(100, Math.round(progress01 * 100)));

  const formatHMS = (ms: number) => {
    const t = Math.floor(ms / 1000);
    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    const s = t % 60;
    const cs = Math.floor((ms % 1000) / 10);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
  };

  const formatMMSS = (secTotal: number) => {
    const m = Math.floor(secTotal / 60);
    const s = Math.floor(secTotal % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }; // [web:146]

  const leftLabel = formatMMSS(secondsFloat); // elapsed in mm:ss
  const rightLabel =
    typeof durationSec === 'number' && durationSec > 0
      ? formatMMSS(durationSec)
      : '01:00';

  return (
    <View style={styles.root}>
      <Svg width={size} height={size}>
        {/* Face */}
        <Circle cx={cx} cy={cy} r={r} fill="#141516" />

        {/* 60 ticks */}
        <G>
          {Array.from({ length: 60 }).map((_, i) => {
            const a = (i / 60) * 2 * Math.PI;
            const x1 = xAt(a, r - tickLen(i));
            const y1 = yAt(a, r - tickLen(i));
            const x2 = xAt(a, r - 4);
            const y2 = yAt(a, r - 4);
            return (
              <Line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#bbbbbb"
                strokeWidth={i % 5 === 0 ? 2.4 : 1.2}
                strokeLinecap="round"
                opacity={i % 5 === 0 ? 1 : 0.85}
              />
            );
          })}
        </G>

        {/* Numerals 5..60 */}
        <G>
          {secondLabels.map(({ sec, x, y }) => (
            <SvgText
              key={sec}
              x={x}
              y={y}
              fill="#bbbbbb"
              fontSize={r * 0.13}
              textAnchor="middle"
            >
              {String(sec)}
            </SvgText>
          ))}
        </G>

        {/* Second hand */}
        <Line
          x1={cx}
          y1={cy}
          x2={xAt(secAngle, secLen)}
          y2={yAt(secAngle, secLen)}
          stroke="#ff4a4a"
          strokeWidth={5}
          strokeLinecap="round"
          opacity={0.9}
        />

        {/* Center cap */}
        <Circle cx={cx} cy={cy} r={5} fill="#ffffff" />
      </Svg>
      {typeof durationSec === 'number' && durationSec > 0 && (
        <Text style={styles.helper}>{progressPct}% completado</Text>
      )}
      {/* Progress Bar (under chronometer) */}
      <View style={styles.progressContainer}>
        <Text style={styles.timeLabel}>{leftLabel}</Text>
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
            <View style={[styles.progressThumb, { left: `${progressPct}%` }]} />
          </View>
        </View>
        <Text style={styles.timeLabel}>{rightLabel}</Text>
      </View>
      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity onPress={isRunning ? pause : start} style={styles.btn}>
          <Text style={styles.btnText}>{isRunning ? 'Pausar' : 'Iniciar'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={reset} style={styles.btn}>
          <Text style={styles.btnText}>Reiniciar</Text>
        </TouchableOpacity>
      </View>


    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center' },
  timerText: {
    color: '#fff',
    fontSize: 48,
    fontWeight: '300',
    letterSpacing: 4,
    marginBottom: 8,
    marginTop: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
    marginVertical: 16,
    width: '100%',
  },
  timeLabel: {
    color: '#666',
    fontSize: 12,
    minWidth: 44,
    textAlign: 'center',
  },
  progressBarContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#3a3a3a',
    borderRadius: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 6,
    backgroundColor: '#ff6b4a',
    borderRadius: 3,
    width: '0%',
  },
  progressThumb: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ff6b4a',
    top: -5,
    marginLeft: -8,
  },
  controls: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  btn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#e8e8e8',
  },
  btnText: {
    color: '#111',
    fontWeight: '600',
  },
  helper: {
    color: '#fff',
    marginVertical: 16,
  },
});
