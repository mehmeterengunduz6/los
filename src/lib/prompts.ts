import { PersonalizationData, CurriculumNode, NodeChatHistory } from '@/types';

// The recursive learning methodology prompt
export const RECURSIVE_LEARNING_METHODOLOGY = `
Teaching rules:
- Teach in small numbered steps.
- Each step must cover one idea only.
- Assume no prior knowledge.
- After each step, pause and ask: "Do you have any questions?"
- Do not move on until the user confirms understanding.
- If the user is confused, explain the same idea again in a different way.
- When the user says they understand, verify with questions before continuing.
- If verification reveals a gap, go deeper only on that gap, then return to the plan.
- Never rush or jump ahead.
- No summaries unless asked.

Teaching style:
- Act like a calm human instructor.
- Use intuition, real-world analogies, and mental models first.
- Introduce formulas, notation, or jargon only after intuition is clear.
- Be explicit when correcting mistakes.
`;

// Generate the system prompt for curriculum generation
export function getCurriculumGenerationPrompt(personalization: PersonalizationData): string {
  return `You are an expert curriculum designer and teacher. Your task is to create a structured learning curriculum for a student.

Student Profile:
- Name: ${personalization.name}
- Topic to learn: ${personalization.topic}
- Background: ${personalization.background}
- Current knowledge level: ${personalization.knowledgeLevel}
- Learning goals: ${personalization.learningGoals}
- Time commitment: ${personalization.timeCommitment}

Create a comprehensive curriculum to teach "${personalization.topic}" from zero to mastery.

IMPORTANT: You must respond with ONLY a valid JSON object, no markdown, no explanation, no code blocks. The response should be parseable JSON.

The JSON structure must be:
{
  "title": "Main topic title",
  "description": "Brief description of what will be learned",
  "children": [
    {
      "title": "Subtopic 1 title",
      "description": "What this subtopic covers",
      "children": [
        {
          "title": "Sub-subtopic 1.1 title",
          "description": "Specific concept to learn",
          "children": []
        }
      ]
    }
  ]
}

Guidelines for the curriculum:
1. Start from first principles - assume no prior knowledge
2. Build concepts progressively - each topic should build on previous ones
3. Create 4-6 main subtopics at the top level
4. Each subtopic can have 2-4 sub-subtopics
5. Sub-subtopics can have 1-3 deeper topics if needed
6. Keep titles concise but descriptive
7. Descriptions should explain what the learner will understand after completing that section
8. Order topics from foundational to advanced
9. Consider the student's background and goals when structuring the curriculum

Remember: Return ONLY valid JSON, nothing else.`;
}

// Generate the system prompt for a node chat
export function getNodeChatSystemPrompt(
  personalization: PersonalizationData,
  currentNode: CurriculumNode,
  curriculum: CurriculumNode,
  chatHistories: Record<string, NodeChatHistory>
): string {
  // Build context from other node chats
  const contextFromOtherNodes = buildContextFromOtherNodes(currentNode, chatHistories, curriculum);
  
  // Get the path to current node
  const pathToNode = getPathToNode(currentNode.id, curriculum);
  
  return `You are a patient, expert teacher helping ${personalization.name} learn ${personalization.topic}.

Student Profile:
- Background: ${personalization.background}
- Knowledge level: ${personalization.knowledgeLevel}
- Learning goals: ${personalization.learningGoals}

Current Learning Context:
You are teaching the topic: "${currentNode.title}"
Description: ${currentNode.description}
Learning path: ${pathToNode.map(n => n.title).join(' → ')}

${contextFromOtherNodes ? `Context from previous lessons:\n${contextFromOtherNodes}\n` : ''}

${RECURSIVE_LEARNING_METHODOLOGY}

For this specific topic "${currentNode.title}":
1. If this is the first message in this topic, start by presenting a brief overview and your teaching plan for this specific topic.
2. Follow the recursive learning methodology strictly.
3. Use the student's background to make relevant analogies.
4. Remember what was taught in previous topics and build upon that knowledge.
5. Keep your responses focused and not too long - teach one small concept at a time.

Begin teaching when the user is ready.`;
}

// Build context summary from other node chats
function buildContextFromOtherNodes(
  currentNode: CurriculumNode,
  chatHistories: Record<string, NodeChatHistory>,
  curriculum: CurriculumNode
): string {
  const contexts: string[] = [];
  
  // Get all ancestor nodes
  const ancestors = getAncestorNodes(currentNode.id, curriculum);
  
  for (const ancestor of ancestors) {
    const history = chatHistories[ancestor.id];
    if (history && history.messages.length > 0) {
      const summary = history.summary || summarizeChat(history.messages);
      contexts.push(`[${ancestor.title}]: ${summary}`);
    }
  }
  
  // Also include sibling node contexts if they exist
  if (currentNode.parentId) {
    const parent = findNodeById(currentNode.parentId, curriculum);
    if (parent) {
      for (const sibling of parent.children) {
        if (sibling.id !== currentNode.id) {
          const history = chatHistories[sibling.id];
          if (history && history.messages.length > 0) {
            const summary = history.summary || summarizeChat(history.messages);
            contexts.push(`[Sibling: ${sibling.title}]: ${summary}`);
          }
        }
      }
    }
  }
  
  return contexts.join('\n');
}

// Get the path from root to a specific node
function getPathToNode(nodeId: string, curriculum: CurriculumNode): CurriculumNode[] {
  const path: CurriculumNode[] = [];
  
  function search(node: CurriculumNode, currentPath: CurriculumNode[]): boolean {
    const newPath = [...currentPath, node];
    if (node.id === nodeId) {
      path.push(...newPath);
      return true;
    }
    for (const child of node.children) {
      if (search(child, newPath)) {
        return true;
      }
    }
    return false;
  }
  
  search(curriculum, []);
  return path;
}

// Get all ancestor nodes
function getAncestorNodes(nodeId: string, curriculum: CurriculumNode): CurriculumNode[] {
  const path = getPathToNode(nodeId, curriculum);
  return path.slice(0, -1); // Exclude the node itself
}

// Find a node by ID
function findNodeById(nodeId: string, curriculum: CurriculumNode): CurriculumNode | null {
  if (curriculum.id === nodeId) {
    return curriculum;
  }
  for (const child of curriculum.children) {
    const found = findNodeById(nodeId, child);
    if (found) return found;
  }
  return null;
}

// Simple chat summarization (for context)
function summarizeChat(messages: { role: string; content: string }[]): string {
  // Get last few assistant messages as summary
  const assistantMessages = messages
    .filter(m => m.role === 'assistant')
    .slice(-2)
    .map(m => m.content.slice(0, 200));
  
  if (assistantMessages.length === 0) {
    return 'No content yet';
  }
  
  return assistantMessages.join(' ... ').slice(0, 400) + '...';
}

export { findNodeById, getPathToNode };

