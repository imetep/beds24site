import type { Metadata } from 'next';
import AdminSegnalazioni from '@/components/admin/AdminSegnalazioni';

export const metadata: Metadata = {
  title:  'Admin — Segnalazioni — LivingApple',
  robots: 'noindex, nofollow',
};

export default function AdminSegnalazioniPage() {
  return <AdminSegnalazioni />;
}
