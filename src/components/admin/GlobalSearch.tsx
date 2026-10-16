/**
 * GlobalSearch — بحث شامل Cmd+K / Ctrl+K
 */
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Loader2 } from 'lucide-react';

interface Result {
  type: string;
  icon: string;
  title: string;
  subtitle: string;
  href: string;
}

export default function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // اختصار Cmd+K / Ctrl+K
  useEffect(() => {
    function keyHandler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', keyHandler);
    return () => window.removeEventListener('keydown', keyHandler);
  }, []);

  // تركيز الحقل عند الفتح
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    else { setQuery(''); setResults([]); setActiveIdx(0); }
  }, [open]);

  // البحث مع debounce
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results || []);
        setActiveIdx(0);
      } finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  function goTo(href: string) {
    setOpen(false);
    router.push(href);
  }

  function keyNav(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(results.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter' && results[activeIdx]) {
      goTo(results[activeIdx].href);
    }
  }

  return (
    <>
      {/* زر البحث في الـ sidebar */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-cream-100 hover:bg-white/10 rounded-lg transition-colors border border-white/10"
      >
        <Search className="w-4 h-4" />
        <span className="flex-1 text-right">بحث...</span>
        <kbd className="text-[9px] px-1.5 py-0.5 bg-white/10 rounded font-en-display">Ctrl K</kbd>
      </button>

      {/* المودال */}
      {open && (
        <div
          className="fixed inset-0 z-[100] bg-ink/60 backdrop-blur-sm flex items-start justify-center p-4 pt-[10vh]"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden"
          >
            <div className="relative border-b border-cream-200">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-soft" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={keyNav}
                placeholder="ابحثي في الحجوزات، العميلات، الخدمات..."
                className="w-full py-4 pr-12 pl-12 text-base bg-transparent outline-none"
              />
              {loading && <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gold-deep" />}
              {!loading && query && (
                <button onClick={() => setQuery('')} className="absolute left-4 top-1/2 -translate-y-1/2 p-1 hover:bg-cream-100 rounded">
                  <X className="w-4 h-4 text-ink-soft" />
                </button>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {!query && (
                <div className="p-8 text-center text-sm text-ink-soft">
                  اكتبي للبحث في كل شي في اللوحة ✨
                  <div className="mt-3 text-[10px] opacity-70">
                    اضغطي <kbd className="px-1.5 py-0.5 bg-cream-100 rounded font-en-display">↑</kbd> <kbd className="px-1.5 py-0.5 bg-cream-100 rounded font-en-display">↓</kbd> للتنقّل، <kbd className="px-1.5 py-0.5 bg-cream-100 rounded font-en-display">Enter</kbd> للفتح، <kbd className="px-1.5 py-0.5 bg-cream-100 rounded font-en-display">Esc</kbd> للخروج
                  </div>
                </div>
              )}

              {query && results.length === 0 && !loading && (
                <div className="p-8 text-center text-sm text-ink-soft">
                  ما لقينا شي بـ "<span className="font-bold">{query}</span>"
                </div>
              )}

              {results.length > 0 && (
                <ul>
                  {results.map((r, i) => (
                    <li key={i}>
                      <button
                        onClick={() => goTo(r.href)}
                        onMouseEnter={() => setActiveIdx(i)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-right transition-colors ${
                          i === activeIdx ? 'bg-gold-light/15' : 'hover:bg-cream-50'
                        }`}
                      >
                        <span className="text-xl shrink-0">{r.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm text-ink">{r.title}</div>
                          <div className="text-xs text-ink-soft mt-0.5 truncate">{r.subtitle}</div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
