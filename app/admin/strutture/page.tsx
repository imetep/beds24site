import type { Metadata } from 'next';
import AdminStrutture from '@/components/admin/AdminStrutture';

export const metadata: Metadata = {
  title:  'Admin — Strutture — LivingApple',
  robots: 'noindex, nofollow',
};

export default function AdminStrutturePage() {
  return <AdminStrutture />;
}
