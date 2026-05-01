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
  const t = getTranslations(locale).components.privacy;
  return {
    title: t.metaTitle,
    description: t.metaDescription,
  };
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const t = getTranslations(locale).components.privacy;

  return (
    <div className="page-container page-top pb-5">
      <h1 className="fs-1 fw-bold mb-1">{t.h1}</h1>
      <p className="text-muted mb-3">{t.subtitle}</p>
      <div className="alert alert-primary"><strong>{t.infoBox}</strong></div>
      <div className="text-secondary legal-prose">
        <p>{t.p1}</p>
        <p>{t.p2}</p>
        <p>{t.p3}</p>
        <p>{t.p4}</p>
        <p>{t.p5}</p>

        <h2 className="fs-5 fw-bold text-primary border-bottom pb-2 mt-4 mb-2">{t.h2Purposes}</h2>
        <ol className="ps-4 my-2">
          <li>{t.purpose1}</li>
          <li>{t.purpose2}</li>
          <li>{t.purpose3}</li>
        </ol>

        <h2 className="fs-5 fw-bold text-primary border-bottom pb-2 mt-4 mb-2">{t.h2Rights}</h2>
        <p>{t.rightsIntro}</p>
        <ul className="ps-4 my-2">
          <li>{t.right1}</li>
          <li>{t.right2}</li>
          <li>{t.right3}</li>
          <li>{t.right4}</li>
        </ul>

        <h2 className="fs-5 fw-bold text-primary border-bottom pb-2 mt-4 mb-2">{t.h2Contact}</h2>
        <p>{t.contactIntro}</p>
        <div className="bg-light border rounded p-3 mt-2 legal-prose">
          <strong>Livingapple S.r.l.</strong><br />
          Loc. LeTore, Traversa Carmen Rosati n. 2<br />
          04028 Scauri di Minturno (LT) — Italy
        </div>
      </div>
    </div>
  );
}
