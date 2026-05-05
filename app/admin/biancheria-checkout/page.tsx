import type { Metadata } from 'next';
import AdminBiancheriaCheckout from '@/components/admin/AdminBiancheriaCheckout';

export const metadata: Metadata = {
  title:  'Admin — Biancheria check-out — LivingApple',
  robots: 'noindex, nofollow',
};

export default function AdminBiancheriaCheckoutPage() {
  return <AdminBiancheriaCheckout />;
}
