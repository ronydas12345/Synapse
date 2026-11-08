import { NODE_CAPTIONS } from './config';
import { useEditorExperience } from './useEditorExperience';

export default function NodeCaption({ nodeType }: { nodeType: string }) {
  const show = useEditorExperience().nodeCaptions;
  const text = NODE_CAPTIONS[nodeType];
  if (!show || !text) return null;
  return <p className="synapse-node-caption">{text}</p>;
}
