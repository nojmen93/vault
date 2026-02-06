'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BrainNode {
  id: string;
  label: string;
  x: number;
  y: number;
  size: number;
  delay: number;
}

interface BrainConnection {
  from: string;
  to: string;
  strength: number;
}

interface BrainVisualizationProps {
  keywords?: string[];
  className?: string;
}

// Brain outline path
const BRAIN_PATH = `
  M 250 40
  C 180 40 120 80 120 140
  C 120 155 125 170 135 185
  C 100 200 70 240 70 290
  C 70 350 110 400 170 420
  C 175 450 200 480 240 490
  C 260 510 290 520 320 520
  C 350 520 380 510 400 490
  C 440 480 465 450 470 420
  C 530 400 570 350 570 290
  C 570 240 540 200 505 185
  C 515 170 520 155 520 140
  C 520 80 460 40 390 40
  C 360 40 335 50 320 65
  C 305 50 280 40 250 40
`;

// Generate nodes positioned inside the brain
function generateNodes(keywords: string[]): BrainNode[] {
  const positions = [
    { x: 200, y: 180 },
    { x: 320, y: 150 },
    { x: 440, y: 180 },
    { x: 160, y: 280 },
    { x: 280, y: 250 },
    { x: 400, y: 280 },
    { x: 480, y: 260 },
    { x: 220, y: 350 },
    { x: 350, y: 320 },
    { x: 420, y: 380 },
    { x: 280, y: 420 },
    { x: 380, y: 450 },
  ];

  return keywords.slice(0, 12).map((keyword, i) => ({
    id: `node-${i}`,
    label: keyword.length > 12 ? keyword.slice(0, 10) + '...' : keyword,
    x: positions[i]?.x || 320 + (Math.random() - 0.5) * 200,
    y: positions[i]?.y || 300 + (Math.random() - 0.5) * 200,
    size: 8 + Math.random() * 6,
    delay: i * 0.15,
  }));
}

// Generate connections between nearby nodes
function generateConnections(nodes: BrainNode[]): BrainConnection[] {
  const connections: BrainConnection[] = [];

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dist = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
      if (dist < 180 && connections.length < 15) {
        connections.push({
          from: nodes[i].id,
          to: nodes[j].id,
          strength: 1 - dist / 180,
        });
      }
    }
  }

  return connections;
}

export function BrainVisualization({
  keywords = [],
  className,
}: BrainVisualizationProps): React.ReactElement {
  const [isVisible, setIsVisible] = useState(false);
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [pulseIndex, setPulseIndex] = useState(0);

  // Generate nodes and connections from keywords
  const nodes = useMemo(() => generateNodes(keywords), [keywords]);
  const connections = useMemo(() => generateConnections(nodes), [nodes]);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Pulse through nodes
  useEffect(() => {
    if (nodes.length === 0) return;

    const interval = setInterval(() => {
      setPulseIndex((prev) => (prev + 1) % nodes.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [nodes.length]);

  const nodeMap = useMemo(() => {
    const map: Record<string, BrainNode> = {};
    nodes.forEach((n) => (map[n.id] = n));
    return map;
  }, [nodes]);

  return (
    <div className={cn('relative w-full max-w-2xl mx-auto h-full', className)}>
      {/* Ambient glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-64 h-64 rounded-full bg-purple-500/10 blur-3xl animate-pulse" />
      </div>

      <svg
        viewBox="0 0 640 560"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Gradient for brain outline */}
          <linearGradient id="brainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgb(168, 85, 247)" stopOpacity="0.6" />
            <stop offset="50%" stopColor="rgb(59, 130, 246)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="rgb(168, 85, 247)" stopOpacity="0.6" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Node glow */}
          <filter id="nodeGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Brain outline */}
        <motion.path
          d={BRAIN_PATH}
          fill="none"
          stroke="url(#brainGradient)"
          strokeWidth="2"
          strokeLinecap="round"
          filter="url(#glow)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: isVisible ? 1 : 0, opacity: isVisible ? 1 : 0 }}
          transition={{ duration: 2, ease: 'easeInOut' }}
        />

        {/* Connections */}
        <AnimatePresence>
          {isVisible && connections.map((conn, i) => {
            const fromNode = nodeMap[conn.from];
            const toNode = nodeMap[conn.to];
            if (!fromNode || !toNode) return null;

            const isActive = activeNode === conn.from || activeNode === conn.to ||
              pulseIndex === nodes.findIndex(n => n.id === conn.from) ||
              pulseIndex === nodes.findIndex(n => n.id === conn.to);

            return (
              <motion.line
                key={`${conn.from}-${conn.to}`}
                x1={fromNode.x}
                y1={fromNode.y}
                x2={toNode.x}
                y2={toNode.y}
                stroke={isActive ? 'rgb(168, 85, 247)' : 'rgb(100, 100, 120)'}
                strokeWidth={isActive ? 2 : 1}
                strokeOpacity={isActive ? 0.8 : 0.3}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{
                  pathLength: 1,
                  opacity: 1,
                  strokeOpacity: isActive ? 0.8 : 0.3,
                }}
                transition={{
                  duration: 0.8,
                  delay: 1.5 + i * 0.1,
                  strokeOpacity: { duration: 0.3 }
                }}
              />
            );
          })}
        </AnimatePresence>

        {/* Nodes */}
        <AnimatePresence>
          {isVisible && nodes.map((node, i) => {
            const isActive = activeNode === node.id || pulseIndex === i;

            return (
              <motion.g
                key={node.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 1 + node.delay }}
                onMouseEnter={() => setActiveNode(node.id)}
                onMouseLeave={() => setActiveNode(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Node circle */}
                <motion.circle
                  cx={node.x}
                  cy={node.y}
                  r={node.size}
                  fill={isActive ? 'rgb(168, 85, 247)' : 'rgb(80, 80, 100)'}
                  filter={isActive ? 'url(#nodeGlow)' : undefined}
                  animate={{
                    r: isActive ? node.size * 1.3 : node.size,
                    fill: isActive ? 'rgb(168, 85, 247)' : 'rgb(80, 80, 100)',
                  }}
                  transition={{ duration: 0.3 }}
                />

                {/* Node label */}
                <motion.text
                  x={node.x}
                  y={node.y + node.size + 16}
                  textAnchor="middle"
                  fontSize="11"
                  fill={isActive ? 'rgb(200, 180, 255)' : 'rgb(150, 150, 160)'}
                  fontWeight={isActive ? '600' : '400'}
                  animate={{
                    fill: isActive ? 'rgb(200, 180, 255)' : 'rgb(150, 150, 160)',
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {node.label}
                </motion.text>
              </motion.g>
            );
          })}
        </AnimatePresence>

        {/* Floating particles */}
        {isVisible && [...Array(8)].map((_, i) => (
          <motion.circle
            key={`particle-${i}`}
            r="2"
            fill="rgb(168, 85, 247)"
            fillOpacity="0.6"
            initial={{
              cx: 320,
              cy: 280,
              opacity: 0
            }}
            animate={{
              cx: [320, 200 + Math.random() * 240, 320],
              cy: [280, 150 + Math.random() * 300, 280],
              opacity: [0, 0.6, 0],
            }}
            transition={{
              duration: 4 + Math.random() * 2,
              delay: 2 + i * 0.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </svg>

      {/* Empty state */}
      {keywords.length === 0 && isVisible && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-muted-foreground text-sm">
            Generate your profile to see your knowledge map
          </p>
        </div>
      )}
    </div>
  );
}
