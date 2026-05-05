import type { Metadata } from 'next';
import AdminPeriodiche from '@/components/admin/AdminPeriodiche';

export const metadata: Metadata = {
  title:  'Admin — Periodiche — LivingApple',
  robots: 'noindex, nofollow',
};

export default function AdminPeriodichePage() {
  return <AdminPeriodiche />;
}
