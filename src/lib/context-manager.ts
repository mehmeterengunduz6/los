import { CurriculumNode, NodeChatHistory, ChatMessage, LearningSession, PersonalizationData } from '@/types';

const STORAGE_KEY = 'recursive-learning-sessions';
const SAVED_INPUT_KEY = 'recursive-learning-saved-input';

// Save last onboarding input for quick regeneration
export function saveLastInput(personalization: PersonalizationData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SAVED_INPUT_KEY, JSON.stringify(personalization));
}

// Get saved onboarding input
export function getSavedInput(): PersonalizationData | null {
  if (typeof window === 'undefined') return null;
  try {
    const data = localStorage.getItem(SAVED_INPUT_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

// Save session to localStorage
export function saveSession(session: LearningSession): void {
  if (typeof window === 'undefined') return;

  const sessions = getAllSessions();
  sessions[session.id] = {
    ...session,
    updatedAt: Date.now()
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

// Get all sessions from localStorage
export function getAllSessions(): Record<string, LearningSession> {
  if (typeof window === 'undefined') return {};

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

// Get a specific session by ID
export function getSession(sessionId: string): LearningSession | null {
  const sessions = getAllSessions();
  return sessions[sessionId] || null;
}

// Delete a session
export function deleteSession(sessionId: string): void {
  if (typeof window === 'undefined') return;

  const sessions = getAllSessions();
  delete sessions[sessionId];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

// Update node status in a session
export function updateNodeStatus(
  session: LearningSession,
  nodeId: string,
  status: 'not-started' | 'in-progress' | 'completed'
): LearningSession {
  const updatedCurriculum = updateNodeStatusRecursive(session.curriculum, nodeId, status);
  return {
    ...session,
    curriculum: updatedCurriculum,
    updatedAt: Date.now()
  };
}

function updateNodeStatusRecursive(
  node: CurriculumNode,
  nodeId: string,
  status: 'not-started' | 'in-progress' | 'completed'
): CurriculumNode {
  if (node.id === nodeId) {
    return { ...node, status };
  }
  return {
    ...node,
    children: node.children.map(child =>
      updateNodeStatusRecursive(child, nodeId, status)
    )
  };
}

// Add a message to a node's chat history
export function addMessageToHistory(
  session: LearningSession,
  nodeId: string,
  message: ChatMessage
): LearningSession {
  const history = session.chatHistories[nodeId] || {
    nodeId,
    messages: []
  };

  return {
    ...session,
    chatHistories: {
      ...session.chatHistories,
      [nodeId]: {
        ...history,
        messages: [...history.messages, message]
      }
    },
    updatedAt: Date.now()
  };
}

// Get chat history for a specific node
export function getNodeChatHistory(
  session: LearningSession,
  nodeId: string
): NodeChatHistory {
  return session.chatHistories[nodeId] || {
    nodeId,
    messages: []
  };
}

// Generate a summary for a node's chat (for context in other nodes)
export function generateChatSummary(messages: ChatMessage[]): string {
  if (messages.length === 0) return '';

  // Get key points from assistant messages
  const keyPoints = messages
    .filter(m => m.role === 'assistant')
    .map(m => m.content)
    .slice(-3)
    .join('\n')
    .slice(0, 500);

  return keyPoints + (keyPoints.length >= 500 ? '...' : '');
}

// Calculate overall progress
export function calculateProgress(curriculum: CurriculumNode): {
  total: number;
  completed: number;
  inProgress: number;
  percentage: number;
} {
  let total = 0;
  let completed = 0;
  let inProgress = 0;

  function countNodes(node: CurriculumNode): void {
    total++;
    if (node.status === 'completed') completed++;
    if (node.status === 'in-progress') inProgress++;
    node.children.forEach(countNodes);
  }

  countNodes(curriculum);

  return {
    total,
    completed,
    inProgress,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0
  };
}

// Find a node in the curriculum by ID
export function findNodeInCurriculum(
  curriculum: CurriculumNode,
  nodeId: string
): CurriculumNode | null {
  if (curriculum.id === nodeId) return curriculum;

  for (const child of curriculum.children) {
    const found = findNodeInCurriculum(child, nodeId);
    if (found) return found;
  }

  return null;
}

