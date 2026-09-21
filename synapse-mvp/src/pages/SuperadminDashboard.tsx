import StaffShell from '../admin/StaffShell';
import { SUPERADMIN_SECTIONS } from '../admin/model';
import UsersPanel from '../admin/UsersPanel';
import TicketsPanel from '../admin/TicketsPanel';
import StatsPanel from '../admin/StatsPanel';
import ModerationPanel from '../admin/ModerationPanel';
import AdminsPanel from '../admin/AdminsPanel';
import ThemesPanel from '../admin/ThemesPanel';
import AuditPanel from '../admin/AuditPanel';

export default function SuperadminDashboard() {
  return (
    <StaffShell title="Superadmin dashboard" sections={SUPERADMIN_SECTIONS}>
      {(section) => {
        if (section === 'tickets') return <TicketsPanel />;
        if (section === 'stats') return <StatsPanel />;
        if (section === 'moderation') return <ModerationPanel />;
        if (section === 'admins') return <AdminsPanel />;
        if (section === 'themes') return <ThemesPanel />;
        if (section === 'audit') return <AuditPanel />;
        return <UsersPanel />;
      }}
    </StaffShell>
  );
}
