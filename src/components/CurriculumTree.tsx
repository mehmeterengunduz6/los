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
  ConnectionLineType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import CustomNode from './CustomNode';
import { CurriculumNode, CustomNodeData } from '@/types';

// Node types registration
const nodeTypes = {
  custom: CustomNode,
};

// Layout configuration for radial mind map
const ROOT_X = 0;
const ROOT_Y = 0;
const LEVEL_RADIUS = 380; // Distance between depth levels (increased for more spacing)
const NODE_WIDTH = 160;
const NODE_HEIGHT = 50;

interface CurriculumTreeProps {
  curriculum: CurriculumNode;
  onNodeClick: (nodeId: string) => void;
  selectedNodeId: string | null;
}

// Edge colors matching node depth colors
const edgeColors = [
  '#a78bfa', // violet
  '#fda4af', // rose
  '#5eead4', // teal
  '#fcd34d', // amber
  '#7dd3fc', // sky
  '#bef264', // lime
];

function calculateRadialLayout(
  curriculum: CurriculumNode
): { nodes: Node<CustomNodeData>[]; edges: Edge[] } {
  const nodes: Node<CustomNodeData>[] = [];
  const edges: Edge[] = [];

  // Add root node at center
  nodes.push({
    id: curriculum.id,
    type: 'custom',
    position: { x: ROOT_X - NODE_WIDTH / 2, y: ROOT_Y - NODE_HEIGHT / 2 },
    data: {
      id: curriculum.id,
      title: curriculum.title,
      description: curriculum.description,
      status: curriculum.status,
      depth: 0,
      hasChildren: curriculum.children.length > 0,
    },
  });

  // Process first level children - distribute around the root
  const firstLevelCount = curriculum.children.length;

  curriculum.children.forEach((child, index) => {
    // Calculate angle for this branch (distribute evenly around circle)
    const startAngle = -Math.PI / 2; // Start from top
    const angleStep = (2 * Math.PI) / firstLevelCount;
    const angle = startAngle + index * angleStep;

    // Place first level node
    const x1 = ROOT_X + Math.cos(angle) * LEVEL_RADIUS - NODE_WIDTH / 2;
    const y1 = ROOT_Y + Math.sin(angle) * LEVEL_RADIUS - NODE_HEIGHT / 2;

    nodes.push({
      id: child.id,
      type: 'custom',
      position: { x: x1, y: y1 },
      data: {
        id: child.id,
        title: child.title,
        description: child.description,
        status: child.status,
        depth: 1,
        hasChildren: child.children.length > 0,
        sequence: index + 1,
      },
    });

    // Edge from root to first level
    edges.push({
      id: `${curriculum.id}-${child.id}`,
      source: curriculum.id,
      target: child.id,
      type: 'default',
      style: { stroke: edgeColors[0], strokeWidth: 2 },
      animated: child.status === 'in-progress',
    });

    // Process second level children - spread in the same general direction
    if (child.children.length > 0) {
      const spreadAngle = Math.PI / 3; // 60 degree spread
      const secondLevelCount = child.children.length;
      const angleStart = angle - spreadAngle / 2;
      const angleInc = secondLevelCount > 1 ? spreadAngle / (secondLevelCount - 1) : 0;

      child.children.forEach((grandChild, gIndex) => {
        const gAngle = secondLevelCount === 1 ? angle : angleStart + gIndex * angleInc;
        const x2 = ROOT_X + Math.cos(gAngle) * (LEVEL_RADIUS * 1.8) - NODE_WIDTH / 2;
        const y2 = ROOT_Y + Math.sin(gAngle) * (LEVEL_RADIUS * 1.8) - NODE_HEIGHT / 2;

        nodes.push({
          id: grandChild.id,
          type: 'custom',
          position: { x: x2, y: y2 },
          data: {
            id: grandChild.id,
            title: grandChild.title,
            description: grandChild.description,
            status: grandChild.status,
            depth: 2,
            hasChildren: grandChild.children.length > 0,
            sequence: gIndex + 1,
          },
        });

        edges.push({
          id: `${child.id}-${grandChild.id}`,
          source: child.id,
          target: grandChild.id,
          type: 'default',
          style: { stroke: edgeColors[1], strokeWidth: 2 },
          animated: grandChild.status === 'in-progress',
        });

        // Process third level children
        if (grandChild.children.length > 0) {
          const thirdSpread = Math.PI / 4;
          const thirdCount = grandChild.children.length;
          const thirdStart = gAngle - thirdSpread / 2;
          const thirdInc = thirdCount > 1 ? thirdSpread / (thirdCount - 1) : 0;

          grandChild.children.forEach((greatGrand, ggIndex) => {
            const ggAngle = thirdCount === 1 ? gAngle : thirdStart + ggIndex * thirdInc;
            const x3 = ROOT_X + Math.cos(ggAngle) * (LEVEL_RADIUS * 2.5) - NODE_WIDTH / 2;
            const y3 = ROOT_Y + Math.sin(ggAngle) * (LEVEL_RADIUS * 2.5) - NODE_HEIGHT / 2;

            nodes.push({
              id: greatGrand.id,
              type: 'custom',
              position: { x: x3, y: y3 },
              data: {
                id: greatGrand.id,
                title: greatGrand.title,
                description: greatGrand.description,
                status: greatGrand.status,
                depth: 3,
                hasChildren: greatGrand.children.length > 0,
                sequence: ggIndex + 1,
              },
            });

            edges.push({
              id: `${grandChild.id}-${greatGrand.id}`,
              source: grandChild.id,
              target: greatGrand.id,
              type: 'default',
              style: { stroke: edgeColors[2], strokeWidth: 2 },
              animated: greatGrand.status === 'in-progress',
            });

            // Fourth level (if exists)
            if (greatGrand.children.length > 0) {
              const fourthSpread = Math.PI / 5;
              const fourthCount = greatGrand.children.length;
              const fourthStart = ggAngle - fourthSpread / 2;
              const fourthInc = fourthCount > 1 ? fourthSpread / (fourthCount - 1) : 0;

              greatGrand.children.forEach((ggChild, gggIndex) => {
                const gggAngle = fourthCount === 1 ? ggAngle : fourthStart + gggIndex * fourthInc;
                const x4 = ROOT_X + Math.cos(gggAngle) * (LEVEL_RADIUS * 3.2) - NODE_WIDTH / 2;
                const y4 = ROOT_Y + Math.sin(gggAngle) * (LEVEL_RADIUS * 3.2) - NODE_HEIGHT / 2;

                nodes.push({
                  id: ggChild.id,
                  type: 'custom',
                  position: { x: x4, y: y4 },
                  data: {
                    id: ggChild.id,
                    title: ggChild.title,
                    description: ggChild.description,
                    status: ggChild.status,
                    depth: 4,
                    hasChildren: ggChild.children.length > 0,
                    sequence: gggIndex + 1,
                  },
                });

                edges.push({
                  id: `${greatGrand.id}-${ggChild.id}`,
                  source: greatGrand.id,
                  target: ggChild.id,
                  type: 'default',
                  style: { stroke: edgeColors[3], strokeWidth: 2 },
                  animated: ggChild.status === 'in-progress',
                });
              });
            }
          });
        }
      });
    }
  });

  return { nodes, edges };
}

export default function CurriculumTree({
  curriculum,
  onNodeClick,
  selectedNodeId
}: CurriculumTreeProps) {
  // Calculate initial layout
  const initialLayout = useMemo(() => {
    return calculateRadialLayout(curriculum);
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
    <div className="w-full h-full bg-zinc-100">
      <ReactFlow
        nodes={nodesWithSelection}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        connectionLineType={ConnectionLineType.Bezier}
        fitView
        fitViewOptions={{
          padding: 0.3,
          minZoom: 0.2,
          maxZoom: 1.5,
        }}
        minZoom={0.1}
        maxZoom={2}
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="#d4d4d8"
        />
        <Controls
          className="!bg-white !border-zinc-300 !shadow-lg"
          showInteractive={false}
        />
        <MiniMap
          className="!bg-white !border-zinc-300"
          nodeColor={(node) => {
            const depth = (node.data as CustomNodeData).depth;
            const colors = ['#a78bfa', '#fda4af', '#5eead4', '#fcd34d', '#7dd3fc', '#bef264'];
            return colors[Math.min(depth, colors.length - 1)];
          }}
          maskColor="rgb(255, 255, 255, 0.8)"
        />
      </ReactFlow>
    </div>
  );
}
