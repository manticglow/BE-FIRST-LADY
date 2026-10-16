// Share — uses Web Share API + clipboard fallback
interface ShareOptions { title?: string; text: string; url?: string; dialogTitle?: string; }
export async function share(opts: ShareOptions): Promise<boolean> {
  if (typeof navigator !== 'undefined' && (navigator as any).share) {
    try {
      await (navigator as any).share({ title: opts.title, text: opts.text, url: opts.url });
      return true;
    } catch { /* fallthrough to clipboard */ }
  }
  try {
    const content = [opts.text, opts.url].filter(Boolean).join('\n');
    await navigator.clipboard.writeText(content);
    return true;
  } catch { return false; }
}
