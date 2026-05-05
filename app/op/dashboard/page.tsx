import type { Metadata } from 'next';
import OpDashboard from '@/components/op/OpDashboard';

export const metadata: Metadata = {
  title:  'I miei task — LivingApple Operatori',
  robots: 'noindex, nofollow',
};

export default function OpDashboardPage() {
  return <OpDashboard />;
}
