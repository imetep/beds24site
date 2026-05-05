import type { Metadata } from 'next';
import AdminTelegram from '@/components/admin/AdminTelegram';

export const metadata: Metadata = {
  title:  'Admin — Telegram — LivingApple',
  robots: 'noindex, nofollow',
};

export default function AdminTelegramPage() {
  return <AdminTelegram />;
}
