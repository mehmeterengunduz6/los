'use client';

import { CurriculumNode } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, PlayCircle, ChevronRight } from 'lucide-react';

interface CurriculumChecklistProps {
    curriculum: CurriculumNode;
    selectedNodeId: string | null;
    onNodeClick: (nodeId: string) => void;
}

// Flatten curriculum to get all nodes in order
function flattenCurriculum(node: CurriculumNode, depth: number = 0): { node: CurriculumNode; depth: number }[] {
    const result: { node: CurriculumNode; depth: number }[] = [{ node, depth }];
    node.children.forEach(child => {
        result.push(...flattenCurriculum(child, depth + 1));
    });
    return result;
}

// Find the next node to continue with
function findNextNode(curriculum: CurriculumNode): CurriculumNode | null {
    // First, find any in-progress node
    const inProgress = findNodeByStatus(curriculum, 'in-progress');
    if (inProgress) return inProgress;

    // Otherwise, find the first not-started node
    const notStarted = findNodeByStatus(curriculum, 'not-started');
    return notStarted;
}

function findNodeByStatus(node: CurriculumNode, status: string): CurriculumNode | null {
    if (node.status === status && node.depth > 0) return node;
    for (const child of node.children) {
        const found = findNodeByStatus(child, status);
        if (found) return found;
    }
    return null;
}

export default function CurriculumChecklist({
    curriculum,
    selectedNodeId,
    onNodeClick,
}: CurriculumChecklistProps) {
    const flatNodes = flattenCurriculum(curriculum);
    const nextNode = findNextNode(curriculum);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
            case 'in-progress':
                return <PlayCircle className="w-4 h-4 text-amber-400" />;
            default:
                return <Circle className="w-4 h-4 text-zinc-500" />;
        }
    };

    return (
        <div className="h-full flex flex-col bg-zinc-900 border-r border-zinc-800 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-zinc-800 flex-shrink-0">
                <h2 className="text-sm font-medium text-zinc-300 uppercase tracking-wider mb-3">
                    Learning Path
                </h2>

                {/* Start/Continue Button */}
                {nextNode && (
                    <Button
                        onClick={() => onNodeClick(nextNode.id)}
                        className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-black font-medium"
                    >
                        <PlayCircle className="w-4 h-4 mr-2" />
                        {nextNode.status === 'in-progress' ? 'Continue' : 'Start'}: {nextNode.title.slice(0, 20)}
                        {nextNode.title.length > 20 ? '...' : ''}
                    </Button>
                )}
            </div>

            {/* Checklist */}
            <div className="flex-1 min-h-0 overflow-auto">
                <div className="p-2 min-w-max">
                    {flatNodes.map(({ node, depth }, index) => {
                        const isSelected = node.id === selectedNodeId;
                        const isRoot = depth === 0;

                        return (
                            <button
                                key={node.id}
                                onClick={() => onNodeClick(node.id)}
                                className={`
                  w-full text-left px-3 py-2 rounded-lg mb-1 transition-all whitespace-nowrap
                  ${isSelected
                                        ? 'bg-amber-500/20 border border-amber-500/30'
                                        : 'hover:bg-zinc-800/50 border border-transparent'
                                    }
                  ${isRoot ? 'mb-2' : ''}
                `}
                                style={{ paddingLeft: `${depth * 16 + 12}px` }}
                            >
                                <div className="flex items-center gap-2">
                                    {!isRoot && (
                                        <span className="text-xs text-zinc-500 w-4 text-center">
                                            {index}.
                                        </span>
                                    )}
                                    {getStatusIcon(node.status)}
                                    <span className={`
                    text-sm flex-1
                    ${node.status === 'completed'
                                            ? 'text-zinc-500 line-through'
                                            : node.status === 'in-progress'
                                                ? 'text-amber-200 font-medium'
                                                : 'text-zinc-300'
                                        }
                    ${isRoot ? 'font-semibold text-white text-base' : ''}
                  `}>
                                        {node.title}
                                    </span>
                                    {!isRoot && (
                                        <ChevronRight className="w-3 h-3 text-zinc-600" />
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Legend */}
            <div className="p-3 border-t border-zinc-800 text-xs text-zinc-500">
                <div className="flex items-center gap-4 justify-center">
                    <span className="flex items-center gap-1">
                        <Circle className="w-3 h-3" /> Not started
                    </span>
                    <span className="flex items-center gap-1">
                        <PlayCircle className="w-3 h-3 text-amber-400" /> In progress
                    </span>
                    <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Completed
                    </span>
                </div>
            </div>
        </div>
    );
}
