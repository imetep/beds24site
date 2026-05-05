import type { Metadata } from 'next';
import AdminSmistamento from '@/components/admin/AdminSmistamento';

export const metadata: Metadata = {
  title:  'Admin — Smistamento — LivingApple',
  robots: 'noindex, nofollow',
};

export default function AdminSmistamentoPage() {
  return <AdminSmistamento />;
}
