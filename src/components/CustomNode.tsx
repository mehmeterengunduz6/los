'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { CustomNodeData } from '@/types';

const statusColors = {
  'not-started': {
    bg: 'bg-zinc-800/80',
    border: 'border-zinc-700',
    dot: 'bg-zinc-500',
    text: 'text-zinc-300'
  },
  'in-progress': {
    bg: 'bg-amber-950/50',
    border: 'border-amber-700/50',
    dot: 'bg-amber-400',
    text: 'text-amber-100'
  },
  'completed': {
    bg: 'bg-emerald-950/50',
    border: 'border-emerald-700/50',
    dot: 'bg-emerald-400',
    text: 'text-emerald-100'
  }
};

function CustomNode({ data, selected }: NodeProps<CustomNodeData>) {
  const colors = statusColors[data.status];
  
  return (
    <div 
      className={`
        px-4 py-3 rounded-lg border backdrop-blur-sm
        ${colors.bg} ${colors.border}
        ${selected ? 'ring-2 ring-amber-500/50 shadow-lg shadow-amber-500/10' : 'shadow-lg shadow-black/20'}
        transition-all duration-200 cursor-pointer
        hover:scale-105 hover:shadow-xl
        min-w-[160px] max-w-[220px]
      `}
    >
      {/* Top handle for incoming connections (except root) */}
      {data.depth > 0 && (
        <Handle
          type="target"
          position={Position.Top}
          className="!bg-zinc-500 !border-zinc-400 !w-2 !h-2"
        />
      )}
      
      <div className="flex items-start gap-2">
        {/* Status indicator */}
        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${colors.dot}`} />
        
        <div className="flex-1 min-w-0">
          <h3 className={`font-medium text-sm leading-tight ${colors.text} truncate`}>
            {data.title}
          </h3>
          {data.description && (
            <p className="text-xs text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
              {data.description}
            </p>
          )}
        </div>
      </div>
      
      {/* Bottom handle for outgoing connections */}
      {data.hasChildren && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!bg-zinc-500 !border-zinc-400 !w-2 !h-2"
        />
      )}
    </div>
  );
}

export default memo(CustomNode);

