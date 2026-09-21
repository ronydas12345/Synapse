import StaffShell from '../admin/StaffShell';
import { ADMIN_SECTIONS } from '../admin/model';
import UsersPanel from '../admin/UsersPanel';
import TicketsPanel from '../admin/TicketsPanel';
import StatsPanel from '../admin/StatsPanel';
import ModerationPanel from '../admin/ModerationPanel';

export default function AdminDashboard() {
  return (
    <StaffShell title="Admin dashboard" sections={ADMIN_SECTIONS}>
      {(section) => {
        if (section === 'tickets') return <TicketsPanel />;
        if (section === 'stats') return <StatsPanel />;
        if (section === 'moderation') return <ModerationPanel />;
        return <UsersPanel />;
      }}
    </StaffShell>
  );
}
