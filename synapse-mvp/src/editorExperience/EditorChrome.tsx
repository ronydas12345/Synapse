import { useGraphReadOnly } from '../store';
import CanvasNavExtras from './CanvasNavExtras';
import ExperienceSelector from './ExperienceSelector';
import FirstUseTips from './FirstUseTips';

export default function EditorChrome() {
  const readOnly = useGraphReadOnly();
  return (
    <div className="synapse-editor-chrome">
      {readOnly ? null : <FirstUseTips />}
      <ExperienceSelector />
      <CanvasNavExtras />
    </div>
  );
}
