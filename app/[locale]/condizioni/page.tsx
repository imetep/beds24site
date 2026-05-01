import { Fragment } from 'react';
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
  const t = getTranslations(locale).components.condizioni;
  return {
    title: t.metaTitle,
    description: t.metaDescription,
  };
}

// Renderizza una stringa con marcatori **bold** in JSX (con <strong>).
function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) {
      return <strong key={i}>{p.slice(2, -2)}</strong>;
    }
    return <Fragment key={i}>{p}</Fragment>;
  });
}

export default async function CondizioniPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const t = getTranslations(locale).components.condizioni;

  return (
    <div className="page-container page-top pb-5">
      <h1 className="fs-1 fw-bold mb-1">{t.h1}</h1>
      <p className="text-muted mb-4">{t.subtitle}</p>
      {t.sections.map((section, si) => (
        <div key={si} className="mb-4">
          <h2 className="fs-5 fw-bold text-primary border-bottom pb-2 mb-2">{section.title}</h2>
          <div className="text-secondary legal-prose--narrow">
            {section.paragraphs.map((p, i) => (
              <p key={`p${i}`}>{renderInline(p)}</p>
            ))}
            {section.bullets && (
              <ul className="condizioni__list">
                {section.bullets.map((b, i) => (
                  <li key={`b${i}`}>{renderInline(b)}</li>
                ))}
              </ul>
            )}
            {section.paragraphsAfter && section.paragraphsAfter.map((p, i) => (
              <p key={`pa${i}`}>{renderInline(p)}</p>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
