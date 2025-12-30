// User personalization data collected during onboarding
export interface PersonalizationData {
  name: string;
  topic: string;
  background: string;
  knowledgeLevel: 'complete-beginner' | 'some-familiarity' | 'intermediate' | 'advanced';
  learningGoals: string;
  priorKnowledge?: string; // What the user already knows (e.g., "JavaScript, React")
}

// Message in the onboarding chat
export interface OnboardingMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

// A single node in the curriculum tree
export interface CurriculumNode {
  id: string;
  title: string;
  description: string;
  depth: number;
  parentId: string | null;
  children: CurriculumNode[];
  status: 'not-started' | 'in-progress' | 'completed';
}

// Chat message structure
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

// Chat history for a specific node
export interface NodeChatHistory {
  nodeId: string;
  messages: ChatMessage[];
  summary?: string;
}

// Complete session data
export interface LearningSession {
  id: string;
  personalization: PersonalizationData;
  curriculum: CurriculumNode;
  chatHistories: Record<string, NodeChatHistory>;
  createdAt: number;
  updatedAt: number;
}

// API request/response types
export interface GenerateCurriculumRequest {
  personalization: PersonalizationData;
}

export interface GenerateCurriculumResponse {
  sessionId: string;
  curriculum: CurriculumNode;
}

export interface ChatRequest {
  sessionId: string;
  nodeId: string;
  message: string;
  chatHistories: Record<string, NodeChatHistory>;
  curriculum: CurriculumNode;
  personalization: PersonalizationData;
}

// React Flow node data
export interface CustomNodeData {
  id: string;
  title: string;
  description: string;
  status: 'not-started' | 'in-progress' | 'completed';
  depth: number;
  hasChildren: boolean;
  sequence?: number; // Optional sequence number for ordering
}

