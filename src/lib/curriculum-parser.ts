import { v4 as uuidv4 } from 'uuid';
import { CurriculumNode } from '@/types';

interface RawCurriculumNode {
  title: string;
  description: string;
  children?: RawCurriculumNode[];
}

// Parse the LLM response into a structured curriculum tree
export function parseCurriculumResponse(response: string): CurriculumNode {
  // Try to extract JSON from the response
  let jsonString = response.trim();
  
  // Remove markdown code blocks if present
  if (jsonString.startsWith('```')) {
    jsonString = jsonString.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }
  
  // Try to find JSON object in the response
  const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonString = jsonMatch[0];
  }
  
  let rawCurriculum: RawCurriculumNode;
  
  try {
    rawCurriculum = JSON.parse(jsonString);
  } catch {
    // If parsing fails, create a default structure
    console.error('Failed to parse curriculum JSON, creating default structure');
    rawCurriculum = {
      title: 'Learning Path',
      description: 'Your personalized learning curriculum',
      children: [
        {
          title: 'Fundamentals',
          description: 'Core concepts and basics',
          children: []
        },
        {
          title: 'Intermediate Concepts',
          description: 'Building on the fundamentals',
          children: []
        },
        {
          title: 'Advanced Topics',
          description: 'Deep dive into complex areas',
          children: []
        }
      ]
    };
  }
  
  // Convert to our CurriculumNode structure with IDs
  return transformToNode(rawCurriculum, 0, null);
}

// Transform raw curriculum to our node structure
function transformToNode(
  raw: RawCurriculumNode,
  depth: number,
  parentId: string | null
): CurriculumNode {
  const id = uuidv4();
  
  return {
    id,
    title: raw.title || 'Untitled',
    description: raw.description || '',
    depth,
    parentId,
    status: 'not-started',
    children: (raw.children || []).map(child => 
      transformToNode(child, depth + 1, id)
    )
  };
}

// Flatten curriculum tree to array (useful for some operations)
export function flattenCurriculum(node: CurriculumNode): CurriculumNode[] {
  const nodes: CurriculumNode[] = [node];
  for (const child of node.children) {
    nodes.push(...flattenCurriculum(child));
  }
  return nodes;
}

// Count total nodes in curriculum
export function countNodes(node: CurriculumNode): number {
  return 1 + node.children.reduce((sum, child) => sum + countNodes(child), 0);
}

