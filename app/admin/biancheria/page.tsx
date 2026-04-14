import type { Metadata } from 'next';
import AdminBiancheria from '@/components/admin/AdminBiancheria';

export const metadata: Metadata = {
  title: 'Admin — Biancheria — LivingApple',
  robots: 'noindex, nofollow',
};

export default function AdminBiancheriaPage() {
  return <AdminBiancheria />;
}
