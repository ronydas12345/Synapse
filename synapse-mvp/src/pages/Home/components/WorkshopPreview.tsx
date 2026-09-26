import WorkshopHub from '../../../workshop/WorkshopHub';

export default function WorkshopPreview({ full = false }: { full?: boolean }) {
  return <WorkshopHub preview={!full} />;
}
