import { locales, isValidLocale, type Locale } from '@/config/i18n';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getTranslations } from '@/lib/i18n';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const t = getTranslations(locale).components.trattamentoDati;
  return {
    title: t.metaTitle,
    description: t.metaDescription,
  };
}

export default async function TrattamentoDatiPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const t = getTranslations(locale).components.trattamentoDati;

  return (
    <div className="page-container page-top pb-5">
      <h1 className="fs-1 fw-bold mb-3">{t.h1}</h1>
      <div className="alert alert-primary"><strong>{t.infoBox}</strong></div>
      <div className="text-secondary legal-prose">
        <p>{t.intro}</p>
        <ul className="ps-4 my-2">
          <li><strong>{t.purposeA}</strong></li>
          <li><strong>{t.purposeB}</strong></li>
        </ul>
        <p>{t.conferimento}</p>
        <p>{t.baseGiuridica}</p>
        <h2 className="fs-5 fw-bold text-primary border-bottom pb-2 mt-4 mb-2">{t.h2Storage}</h2>
        <p>{t.storage}</p>
        <h2 className="fs-5 fw-bold text-primary border-bottom pb-2 mt-4 mb-2">{t.h2Communication}</h2>
        <p>{t.communication}</p>
        <h2 className="fs-5 fw-bold text-primary border-bottom pb-2 mt-4 mb-2">{t.h2Rights}</h2>
        <p>{t.rightsIntro}</p>
        <div className="bg-light border rounded p-2 my-2">
          <a href="mailto:livingapple@gmail.com" className="text-primary fw-semibold text-decoration-none">
            livingapple@gmail.com
          </a>
        </div>
        <ul className="ps-4 my-2">
          <li>{t.right1}</li>
          <li>{t.right2}</li>
          <li>{t.right3}</li>
          <li>{t.right4}</li>
        </ul>
        <p>{t.rightsFooter}</p>
      </div>
    </div>
  );
}
