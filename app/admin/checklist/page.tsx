import type { Metadata } from 'next';
import AdminChecklist from '@/components/admin/AdminChecklist';

export const metadata: Metadata = {
  title:  'Admin — Checklist — LivingApple',
  robots: 'noindex, nofollow',
};

export default function AdminChecklistPage() {
  return <AdminChecklist />;
}
