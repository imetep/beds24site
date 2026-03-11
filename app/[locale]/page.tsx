export default async function LocalePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <main>
      <h1>Benvenuto su Living Apple</h1>
      <p>Lingua: {locale}</p>
    </main>
  );
}
