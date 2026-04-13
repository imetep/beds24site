import type { Metadata } from 'next';
import AdminPulizie from '@/components/admin/AdminPulizie';

export const metadata: Metadata = {
  title: 'Admin — Pulizie — LivingApple',
  robots: 'noindex, nofollow',
};

export default function AdminPuliziePage() {
  return <AdminPulizie />;
}
