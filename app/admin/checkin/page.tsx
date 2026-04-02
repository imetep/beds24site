import type { Metadata } from 'next';
import AdminCheckin from '@/components/admin/AdminCheckin';

export const metadata: Metadata = {
  title: 'Admin — Check-in — LivingApple',
  robots: 'noindex, nofollow',
};

export default function AdminCheckinPage() {
  return <AdminCheckin />;
}
