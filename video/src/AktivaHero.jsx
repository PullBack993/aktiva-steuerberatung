import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
} from 'remotion';
import { ARROW_PATHS, AK_PATHS } from './brandPaths.js';

const NAVY_DEEP = '#222c44';
const NAVY = '#2e3a55';
const NAVY_SOFT = '#3b4868';
const GOLD = '#b79c6d';
const IVORY = '#f6f3ec';

// Growth arcs, echoing the logo swoosh: quadratic curves rising left -> right.
// Each arc is stroked and revealed via dashoffset, phase-shifted over the loop.
const ARCS = [
  { d: 'M -60 1120 Q 420 1080 760 780 T 1180 300', width: 2.5, opacity: 0.38, phase: 0.0 },
  { d: 'M -60 1230 Q 380 1200 720 940 T 1160 480', width: 1.6, opacity: 0.22, phase: 0.28 },
  { d: 'M -80 1010 Q 460 960 800 640 T 1200 140', width: 1.2, opacity: 0.14, phase: 0.55 },
];
const ARC_LEN = 1900; // safe overestimate of arc path length

// Loop-phased value: rises 0->1 during [inStart, inEnd], holds, falls 1->0
// during [outStart, outEnd]. All in 0..1 loop time.
function cycle(t, inStart, inEnd, outStart, outEnd) {
  if (t < inStart) return 0;
  if (t < inEnd)
    return interpolate(t, [inStart, inEnd], [0, 1], {
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    });
  if (t < outStart) return 1;
  if (t < outEnd)
    return interpolate(t, [outStart, outEnd], [1, 0], {
      easing: Easing.bezier(0.7, 0, 0.84, 0),
    });
  return 0;
}

export const AktivaHero = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();
  const t = frame / durationInFrames; // 0..1 loop time

  // ambient light drift: one full sine period over the loop = seamless
  const lightX = 50 + 14 * Math.sin(2 * Math.PI * t);
  const lightY = 30 + 8 * Math.cos(2 * Math.PI * t);

  // brand arrow: wipe in, hold with a gentle float, soft fade before restart
  const arrowReveal = cycle(t, 0.02, 0.24, 0.86, 0.985);
  const arrowFloat = 6 * Math.sin(2 * Math.PI * (t * 2)); // two gentle bobs per loop
  // wipe travels along the arrow's diagonal (lower-left -> upper-right)
  const wipe = interpolate(arrowReveal, [0, 1], [0, 1150]);

  // shimmer sweep across the arrow once per loop while it holds
  const shimmerX = interpolate(cycle(t, 0.3, 0.62, 2, 3), [0, 1], [250, 1150]);

  // baseline hairlines breathe very slightly
  const gridOpacity = 0.05 + 0.02 * Math.sin(2 * Math.PI * t);

  return (
    <AbsoluteFill style={{ backgroundColor: NAVY_DEEP, overflow: 'hidden' }}>
      {/* soft moving light field */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(120% 90% at ${lightX}% ${lightY}%, ${NAVY} 0%, ${NAVY_DEEP} 58%, #1c2438 100%)`,
        }}
      />

      {/* fine baseline grid */}
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ position: 'absolute', inset: 0, opacity: gridOpacity }}
      >
        {[0.2, 0.4, 0.6, 0.8].map((y) => (
          <line
            key={y}
            x1={0}
            y1={height * y}
            x2={width}
            y2={height * y}
            stroke={IVORY}
            strokeWidth={1}
          />
        ))}
        {[0.25, 0.5, 0.75].map((x) => (
          <line
            key={x}
            x1={width * x}
            y1={0}
            x2={width * x}
            y2={height}
            stroke={IVORY}
            strokeWidth={0.6}
          />
        ))}
      </svg>

      {/* rising growth arcs */}
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ position: 'absolute', inset: 0 }}
      >
        {ARCS.map((arc, i) => {
          const local = (t + arc.phase) % 1;
          const drawn = cycle(local, 0.04, 0.42, 0.78, 0.98);
          return (
            <path
              key={i}
              d={arc.d}
              fill="none"
              stroke={GOLD}
              strokeWidth={arc.width}
              strokeLinecap="round"
              opacity={arc.opacity * (drawn > 0 ? 1 : 0)}
              strokeDasharray={ARC_LEN}
              strokeDashoffset={ARC_LEN * (1 - drawn)}
            />
          );
        })}
      </svg>

      {/* brand arrow, the real vector from the logo */}
      <svg
        width={width}
        height={height}
        viewBox="180 -120 1060 900"
        style={{
          position: 'absolute',
          inset: 0,
          transform: `translateY(${arrowFloat + 260}px)`,
        }}
      >
        <defs>
          <clipPath id="arrow-wipe">
            {/* rectangle sweeping along the arrow's ascent diagonal */}
            <rect
              x={250}
              y={-200}
              width={wipe}
              height={1300}
              transform="rotate(-8 250 500)"
            />
          </clipPath>
          <linearGradient id="arrow-shimmer" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={GOLD} />
            <stop offset="0.5" stopColor="#d3bd93" />
            <stop offset="1" stopColor={GOLD} />
          </linearGradient>
        </defs>
        {/* ghost of the AK ligature: explains the swoosh gap, stays whisper-quiet */}
        <g fill={NAVY_SOFT} opacity={0.5 * interpolate(arrowReveal, [0, 1], [0, 1])}>
          {AK_PATHS.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
        <g clipPath="url(#arrow-wipe)" opacity={interpolate(arrowReveal, [0, 0.08, 1], [0, 0.9, 1])}>
          {ARROW_PATHS.map((d, i) => (
            <path key={i} d={d} fill={GOLD} />
          ))}
          {/* shimmer band clipped to the arrow silhouette; rotation lives on the
              inner rect so it does not rotate the clip region with it */}
          {ARROW_PATHS.map((d, i) => (
            <clipPath key={`c${i}`} id={`arrow-shape-${i}`}>
              <path d={d} />
            </clipPath>
          ))}
          {ARROW_PATHS.map((d, i) => (
            <g key={`s${i}`} clipPath={`url(#arrow-shape-${i})`}>
              <rect
                x={shimmerX - 130}
                y={-200}
                width={260}
                height={1300}
                fill="url(#arrow-shimmer)"
                opacity={0.55}
                transform="rotate(-14 700 300)"
              />
            </g>
          ))}
        </g>
      </svg>

      {/* grain-free vignette for depth */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(140% 120% at 50% 45%, transparent 55%, rgba(16,22,38,0.55) 100%)',
        }}
      />
    </AbsoluteFill>
  );
};
