'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import CurriculumTree from '@/components/CurriculumTree';
import CurriculumChecklist from '@/components/CurriculumChecklist';
import NodeChat from '@/components/NodeChat';
import { LearningSession } from '@/types';
import { getSession, saveSession, calculateProgress } from '@/lib/context-manager';

interface PageProps {
  params: Promise<{ sessionId: string }>;
}

export default function LearnPage({ params }: PageProps) {
  const { sessionId } = use(params);
  const router = useRouter();
  const [session, setSession] = useState<LearningSession | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load session on mount
  useEffect(() => {
    const loadedSession = getSession(sessionId);
    if (loadedSession) {
      setSession(loadedSession);
    }
    setIsLoading(false);
  }, [sessionId]);

  // Handle session updates
  const handleSessionUpdate = useCallback((updatedSession: LearningSession) => {
    setSession(updatedSession);
    saveSession(updatedSession);
  }, []);

  // Handle node click
  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
  }, []);

  // Close chat panel
  const handleCloseChat = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  // Calculate progress
  const progress = session ? calculateProgress(session.curriculum) : null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Loading your learning session...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📚</div>
          <h1 className="text-2xl font-light text-white mb-2">Session Not Found</h1>
          <p className="text-zinc-400 mb-6">
            This learning session doesn&apos;t exist or has been deleted.
          </p>
          <Button
            onClick={() => router.push('/')}
            className="bg-amber-500 hover:bg-amber-600 text-black font-medium"
          >
            Start New Session
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-zinc-950 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-xl">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/')}
                className="text-zinc-400 hover:text-white"
              >
                ← Back
              </Button>
              <div>
                <h1 className="text-lg font-medium text-white">
                  {session.curriculum.title}
                </h1>
                <p className="text-sm text-zinc-500">
                  Learning with {session.personalization.name}
                </p>
              </div>
            </div>

            {progress && (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-zinc-400">Progress</p>
                  <p className="text-lg font-medium text-white">
                    {progress.completed}/{progress.total} topics
                  </p>
                </div>
                <div className="w-32">
                  <Progress
                    value={progress.percentage}
                    className="h-2 bg-zinc-800"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Checklist Sidebar */}
        <div className="w-72 flex-shrink-0">
          <CurriculumChecklist
            curriculum={session.curriculum}
            selectedNodeId={selectedNodeId}
            onNodeClick={handleNodeClick}
          />
        </div>

        {/* Tree visualization */}
        <div className={`flex-1 transition-all duration-300 ${selectedNodeId ? 'w-1/2' : 'w-full'}`}>
          <CurriculumTree
            curriculum={session.curriculum}
            onNodeClick={handleNodeClick}
            selectedNodeId={selectedNodeId}
          />
        </div>

        {/* Chat panel */}
        {selectedNodeId && (
          <div className="w-[400px] border-l border-zinc-800 flex flex-col animate-in slide-in-from-right duration-300">
            <NodeChat
              session={session}
              nodeId={selectedNodeId}
              onClose={handleCloseChat}
              onSessionUpdate={handleSessionUpdate}
            />
          </div>
        )}
      </div>
    </div>
  );
}

