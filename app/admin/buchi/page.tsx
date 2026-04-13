import type { Metadata } from 'next';
import AdminBuchi from '@/components/admin/AdminBuchi';

export const metadata: Metadata = {
  title: 'Admin — Buchi — LivingApple',
  robots: 'noindex, nofollow',
};

export default function AdminBuchiPage() {
  return <AdminBuchi />;
}
