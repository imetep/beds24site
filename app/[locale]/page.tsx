import { getTranslations } from '@/lib/i18n';
import { Locale } from '@/config/i18n';

export default async function LocalePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = await getTranslations(locale);

  return (
    <main>
      <h1>{t.home.hero_title}</h1>
      <p>{t.home.hero_subtitle}</p>
      <button>{t.home.cta}</button>
    </main>
  );
}