import { getTranslations } from '@/lib/i18n';
import { Locale } from '@/config/i18n';
import Wizard from '@/components/wizard/Wizard';

export default async function LocalePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = await getTranslations(locale);

  return (
    <main>
      <Wizard translations={t} />
    </main>
  );
}
