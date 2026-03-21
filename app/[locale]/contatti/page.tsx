import { redirect } from 'next/navigation';
import { isValidLocale, locales, type Locale } from '@/config/i18n';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function ContattiPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) redirect('/it');
  redirect(`/${locale}`);
}
