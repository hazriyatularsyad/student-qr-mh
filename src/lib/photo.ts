import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function usePhotoUrl(path: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    if (!path) { setUrl(null); return; }
    supabase.storage.from('student-photos').createSignedUrl(path, 3600)
      .then(({ data }) => { if (live) setUrl(data?.signedUrl ?? null); })
      .catch(() => { if (live) setUrl(null); });
    return () => { live = false; };
  }, [path]);
  return url;
}
