import type { Metadata } from 'next';
import OpTurnover from '@/components/op/OpTurnover';

export const metadata: Metadata = {
  title:  'Task — LivingApple Operatori',
  robots: 'noindex, nofollow',
};

export default function OpTurnoverPage() {
  return <OpTurnover />;
}
