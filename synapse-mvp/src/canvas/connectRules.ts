import { nodeTypeLabel } from '../nodes/nodeName';

export interface ConnectEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
}

function isBranching(type?: string): boolean {
  return type === 'splitter' || type === 'conditional' || type === 'randomizer';
}

function allowsMultipleInputs(type?: string): boolean {
  return (
    type === 'track' ||
    type === 'end' ||
    type === 'randomizer' ||
    type === 'transition' ||
    type === 'style'
  );
}

function playEdges(edges: ConnectEdge[]): ConnectEdge[] {
  return edges.filter((edge) => !edge.id.startsWith('dashed-'));
}

export function connectionBlockReason(args: {
  sourceId: string;
  targetId: string;
  sourceType?: string;
  targetType?: string;
  sourceData?: unknown;
  targetData?: unknown;
  sourceHandle?: string | null;
  edges: ConnectEdge[];
}): string | null {
  if (args.sourceType === 'comment' || args.targetType === 'comment') {
    return 'Comment nodes cannot be part of the play path.';
  }
  const edges = playEdges(args.edges);
  if (!isBranching(args.sourceType) && edges.some((edge) => edge.source === args.sourceId)) {
    const label = nodeTypeLabel(args.sourceType, args.sourceData);
    return `${label} already has an outgoing connection. Delete that line first, or connect from the next node.`;
  }
  if (
    isBranching(args.sourceType) &&
    edges.some(
      (edge) =>
        edge.source === args.sourceId && edge.sourceHandle === args.sourceHandle
    )
  ) {
    return 'That output path is already connected. Delete the existing line first.';
  }
  if (
    !allowsMultipleInputs(args.targetType) &&
    edges.some((edge) => edge.target === args.targetId)
  ) {
    const label = nodeTypeLabel(args.targetType, args.targetData);
    return `This ${label} already has an incoming connection. Delete it first, or connect into a Track or Randomizer.`;
  }
  return null;
}
