'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { CustomNodeData } from '@/types';

// Pastel colors for mind map nodes based on depth
const depthColors = [
  { bg: 'bg-violet-400/90', border: 'border-violet-500', text: 'text-violet-950' },    // Root - purple
  { bg: 'bg-rose-300/90', border: 'border-rose-400', text: 'text-rose-950' },          // Depth 1 - pink/red
  { bg: 'bg-teal-300/90', border: 'border-teal-400', text: 'text-teal-950' },          // Depth 2 - teal
  { bg: 'bg-amber-300/90', border: 'border-amber-400', text: 'text-amber-950' },       // Depth 3 - orange
  { bg: 'bg-sky-300/90', border: 'border-sky-400', text: 'text-sky-950' },             // Depth 4 - blue
  { bg: 'bg-lime-300/90', border: 'border-lime-400', text: 'text-lime-950' },          // Depth 5+ - green
];

const statusIndicators = {
  'not-started': 'bg-zinc-400',
  'in-progress': 'bg-amber-500',
  'completed': 'bg-emerald-500'
};

function CustomNode({ data, selected }: NodeProps<CustomNodeData>) {
  const colorIndex = Math.min(data.depth, depthColors.length - 1);
  const colors = depthColors[colorIndex];
  const statusColor = statusIndicators[data.status];

  // Root node is larger and more prominent
  const isRoot = data.depth === 0;

  return (
    <div
      className={`
        px-4 py-3 rounded-2xl border-2 backdrop-blur-sm
        ${colors.bg} ${colors.border}
        ${selected ? 'ring-4 ring-amber-400/60 shadow-xl' : 'shadow-lg'}
        transition-all duration-200 cursor-pointer
        hover:scale-105 hover:shadow-xl
        ${isRoot ? 'min-w-[180px] max-w-[240px] py-4' : 'min-w-[120px] max-w-[180px]'}
      `}
    >
      {/* Handles on all sides for radial connections */}
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-transparent !border-0 !w-3 !h-3"
      />
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-transparent !border-0 !w-3 !h-3"
      />
      <Handle
        type="target"
        position={Position.Bottom}
        className="!bg-transparent !border-0 !w-3 !h-3"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-transparent !border-0 !w-3 !h-3"
      />
      <Handle
        type="source"
        position={Position.Top}
        className="!bg-transparent !border-0 !w-3 !h-3"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-transparent !border-0 !w-3 !h-3"
      />
      <Handle
        type="source"
        position={Position.Left}
        className="!bg-transparent !border-0 !w-3 !h-3"
      />

      <div className="flex items-center gap-2">
        {/* Sequence number badge */}
        {data.sequence !== undefined && (
          <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 bg-zinc-800 text-white border border-zinc-600">
            {data.sequence}
          </div>
        )}

        {/* Status indicator */}
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusColor}`} />

        <div className="flex-1 min-w-0 text-center">
          <h3 className={`font-semibold leading-tight ${colors.text} ${isRoot ? 'text-base' : 'text-sm'}`}>
            {data.title}
          </h3>
        </div>
      </div>
    </div>
  );
}

export default memo(CustomNode);
