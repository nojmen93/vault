'use client';

import { useMemo } from 'react';
import type { ThinkingProfile } from '@/lib/ai/thinking-profile';

interface ProfileRadarChartProps {
  profile: ThinkingProfile;
}

interface DataPoint {
  label: string;
  value: number;
  fullLabel: string;
}

export function ProfileRadarChart({ profile }: ProfileRadarChartProps): React.ReactElement {
  const data = useMemo((): DataPoint[] => {
    // Calculate scores based on profile data
    const domainsScore = Math.min((profile.domains.length / 5) * 100, 100);
    const skillsScore = Math.min((profile.skills.length / 6) * 100, 100);
    const strengthsScore = Math.min((profile.strengths.length / 4) * 100, 100);
    const goalsScore = Math.min((profile.goals.length / 3) * 100, 100);
    const themesScore = Math.min((profile.recurringThemes.length / 4) * 100, 100);
    const valuesScore = Math.min((profile.values.length / 3) * 100, 100);

    return [
      { label: 'Domains', value: domainsScore, fullLabel: `${profile.domains.length} domains` },
      { label: 'Skills', value: skillsScore, fullLabel: `${profile.skills.length} skills` },
      { label: 'Strengths', value: strengthsScore, fullLabel: `${profile.strengths.length} strengths` },
      { label: 'Goals', value: goalsScore, fullLabel: `${profile.goals.length} goals` },
      { label: 'Themes', value: themesScore, fullLabel: `${profile.recurringThemes.length} themes` },
      { label: 'Values', value: valuesScore, fullLabel: `${profile.values.length} values` },
    ];
  }, [profile]);

  const centerX = 150;
  const centerY = 150;
  const maxRadius = 100;
  const levels = 4;

  // Calculate polygon points for data
  const angleSlice = (Math.PI * 2) / data.length;

  const getPoint = (index: number, value: number): { x: number; y: number } => {
    const angle = angleSlice * index - Math.PI / 2;
    const radius = (value / 100) * maxRadius;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  };

  // Generate polygon path for data
  const dataPath = data
    .map((d, i) => {
      const point = getPoint(i, d.value);
      return `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`;
    })
    .join(' ') + ' Z';

  // Generate grid levels
  const gridLevels = Array.from({ length: levels }, (_, i) => {
    const levelRadius = ((i + 1) / levels) * maxRadius;
    return data
      .map((_, j) => {
        const angle = angleSlice * j - Math.PI / 2;
        return {
          x: centerX + levelRadius * Math.cos(angle),
          y: centerY + levelRadius * Math.sin(angle),
        };
      })
      .map((p, j) => `${j === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
      .join(' ') + ' Z';
  });

  // Generate axis lines
  const axisLines = data.map((_, i) => {
    const angle = angleSlice * i - Math.PI / 2;
    return {
      x2: centerX + maxRadius * Math.cos(angle),
      y2: centerY + maxRadius * Math.sin(angle),
    };
  });

  // Label positions
  const labelPositions = data.map((d, i) => {
    const angle = angleSlice * i - Math.PI / 2;
    const labelRadius = maxRadius + 30;
    return {
      x: centerX + labelRadius * Math.cos(angle),
      y: centerY + labelRadius * Math.sin(angle),
      label: d.label,
    };
  });

  return (
    <div className="relative">
      <svg viewBox="0 0 300 300" className="w-full max-w-[300px] mx-auto">
        {/* Background grid */}
        {gridLevels.map((path, i) => (
          <path
            key={i}
            d={path}
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.1}
            strokeWidth={1}
          />
        ))}

        {/* Axis lines */}
        {axisLines.map((line, i) => (
          <line
            key={i}
            x1={centerX}
            y1={centerY}
            x2={line.x2}
            y2={line.y2}
            stroke="currentColor"
            strokeOpacity={0.15}
            strokeWidth={1}
          />
        ))}

        {/* Data polygon */}
        <path
          d={dataPath}
          fill="url(#gradient)"
          fillOpacity={0.5}
          stroke="url(#gradientStroke)"
          strokeWidth={2}
        />

        {/* Data points */}
        {data.map((d, i) => {
          const point = getPoint(i, d.value);
          return (
            <circle
              key={i}
              cx={point.x}
              cy={point.y}
              r={4}
              fill="white"
              stroke="url(#gradientStroke)"
              strokeWidth={2}
              className="cursor-pointer"
            >
              <title>{d.fullLabel}</title>
            </circle>
          );
        })}

        {/* Labels */}
        {labelPositions.map((pos, i) => (
          <text
            key={i}
            x={pos.x}
            y={pos.y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-xs fill-muted-foreground font-medium"
          >
            {pos.label}
          </text>
        ))}

        {/* Gradients */}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
          <linearGradient id="gradientStroke" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
