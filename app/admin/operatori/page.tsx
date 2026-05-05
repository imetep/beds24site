import type { Metadata } from 'next';
import AdminOperatori from '@/components/admin/AdminOperatori';

export const metadata: Metadata = {
  title:  'Admin — Operatori — LivingApple',
  robots: 'noindex, nofollow',
};

export default function AdminOperatoriPage() {
  return <AdminOperatori />;
}
