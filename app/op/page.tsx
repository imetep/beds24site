import type { Metadata } from 'next';
import OpLogin from '@/components/op/OpLogin';

export const metadata: Metadata = {
  title:  'Area Operatori — LivingApple',
  robots: 'noindex, nofollow',
};

export default function OpLoginPage() {
  return <OpLogin />;
}
