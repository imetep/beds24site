import type { Metadata } from 'next';
import AdminOperativo from '@/components/admin/AdminOperativo';

export const metadata: Metadata = {
  title: 'Admin — Operativo — LivingApple',
  robots: 'noindex, nofollow',
};

export default function AdminOperativoPage() {
  return <AdminOperativo />;
}
