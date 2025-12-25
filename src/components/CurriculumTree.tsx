'use client';

import { useCallback, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import CustomNode from './CustomNode';
import { CurriculumNode, CustomNodeData } from '@/types';

// Node types registration
const nodeTypes = {
  custom: CustomNode,
};

// Layout configuration
const NODE_WIDTH = 200;
const NODE_HEIGHT = 80;
const HORIZONTAL_SPACING = 60;
const VERTICAL_SPACING = 100;

interface CurriculumTreeProps {
  curriculum: CurriculumNode;
  onNodeClick: (nodeId: string) => void;
  selectedNodeId: string | null;
}

// Calculate tree layout positions
function calculateTreeLayout(
  node: CurriculumNode,
  depth: number = 0,
  siblingIndex: number = 0,
  siblingCount: number = 1,
  parentX: number = 0
): { nodes: Node<CustomNodeData>[]; edges: Edge[]; width: number } {
  const nodes: Node<CustomNodeData>[] = [];
  const edges: Edge[] = [];
  
  // Calculate children first to know the total width
  let childrenData: { nodes: Node<CustomNodeData>[]; edges: Edge[]; width: number }[] = [];
  let totalChildrenWidth = 0;
  
  for (let i = 0; i < node.children.length; i++) {
    const childData = calculateTreeLayout(
      node.children[i],
      depth + 1,
      i,
      node.children.length,
      0 // Will be adjusted later
    );
    childrenData.push(childData);
    totalChildrenWidth += childData.width;
  }
  
  // Add spacing between children
  if (node.children.length > 1) {
    totalChildrenWidth += HORIZONTAL_SPACING * (node.children.length - 1);
  }
  
  // Node width is the max of its own width and children's total width
  const nodeWidth = Math.max(NODE_WIDTH, totalChildrenWidth);
  
  // Calculate this node's position
  const x = parentX + (nodeWidth / 2) - (NODE_WIDTH / 2);
  const y = depth * (NODE_HEIGHT + VERTICAL_SPACING);
  
  // Create this node
  nodes.push({
    id: node.id,
    type: 'custom',
    position: { x, y },
    data: {
      id: node.id,
      title: node.title,
      description: node.description,
      status: node.status,
      depth: node.depth,
      hasChildren: node.children.length > 0,
    },
  });
  
  // Position children and add their nodes/edges
  let childX = parentX;
  for (let i = 0; i < node.children.length; i++) {
    const childData = calculateTreeLayout(
      node.children[i],
      depth + 1,
      i,
      node.children.length,
      childX
    );
    
    nodes.push(...childData.nodes);
    edges.push(...childData.edges);
    
    // Create edge from this node to child
    edges.push({
      id: `${node.id}-${node.children[i].id}`,
      source: node.id,
      target: node.children[i].id,
      type: 'smoothstep',
      style: { stroke: '#52525b', strokeWidth: 2 },
      animated: node.children[i].status === 'in-progress',
    });
    
    childX += childData.width + HORIZONTAL_SPACING;
  }
  
  return { nodes, edges, width: nodeWidth };
}

export default function CurriculumTree({ 
  curriculum, 
  onNodeClick, 
  selectedNodeId 
}: CurriculumTreeProps) {
  // Calculate initial layout
  const initialLayout = useMemo(() => {
    return calculateTreeLayout(curriculum);
  }, [curriculum]);

  // Initialize nodes and edges state
  const [nodes, setNodes, onNodesChange] = useNodesState(initialLayout.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialLayout.edges);

  // Update nodes when curriculum changes
  useMemo(() => {
    setNodes(initialLayout.nodes);
    setEdges(initialLayout.edges);
  }, [initialLayout, setNodes, setEdges]);

  // Update selected state
  const nodesWithSelection = useMemo(() => {
    return nodes.map(node => ({
      ...node,
      selected: node.id === selectedNodeId,
    }));
  }, [nodes, selectedNodeId]);

  // Handle node click
  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    onNodeClick(node.id);
  }, [onNodeClick]);

  return (
    <div className="w-full h-full bg-zinc-950">
      <ReactFlow
        nodes={nodesWithSelection}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{
          padding: 0.2,
          minZoom: 0.3,
          maxZoom: 1.5,
        }}
        minZoom={0.1}
        maxZoom={2}
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={20} 
          size={1} 
          color="#27272a" 
        />
        <Controls 
          className="!bg-zinc-800 !border-zinc-700 !shadow-xl"
          showInteractive={false}
        />
        <MiniMap 
          className="!bg-zinc-900 !border-zinc-700"
          nodeColor={(node) => {
            const status = (node.data as CustomNodeData).status;
            if (status === 'completed') return '#10b981';
            if (status === 'in-progress') return '#f59e0b';
            return '#52525b';
          }}
          maskColor="rgb(0, 0, 0, 0.8)"
        />
      </ReactFlow>
    </div>
  );
}

