type CoversMap = Record<string, string | null>;

let coversPromise: Promise<CoversMap | null> | null = null;
const folderPromises = new Map<string, Promise<string[] | null>>();

export function fetchCoversCached(): Promise<CoversMap | null> {
  if (!coversPromise) {
    coversPromise = fetch('/api/cloudinary?covers=true')
      .then(r => (r.ok ? r.json() : null))
      .then(d => (d?.covers ?? null) as CoversMap | null)
      .catch(() => null);
  }
  return coversPromise;
}

export function fetchFolderPhotosCached(folder: string): Promise<string[] | null> {
  const existing = folderPromises.get(folder);
  if (existing) return existing;
  const p = fetch(`/api/cloudinary?folder=${encodeURIComponent(folder)}`)
    .then(r => (r.ok ? r.json() : null))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .then(d => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw: any[] = d?.photos ?? [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return raw.map((x: any) => x.url ?? x).filter(Boolean) as string[];
    })
    .catch(() => null);
  folderPromises.set(folder, p);
  return p;
}
