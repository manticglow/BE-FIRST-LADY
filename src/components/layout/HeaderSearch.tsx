'use client';

/**
 * HeaderSearch — صندوق بحث overlay
 * ═══════════════════════════════════════════════════════════
 * - زر بحث في الهيدر يفتح overlay فاخر
 * - بحث سريع في الخدمات والبكجات (debounced)
 * - keyboard shortcut: Cmd/Ctrl + K
 * - keyboard navigation: ↑↓ Enter Esc
 */
import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Search, X, Clock, Sparkles, Gift, Package as PkgIcon, Tag, Loader2,
} from 'lucide-react';
import { formatPrice, formatDuration } from '@/lib/utils';
import type { Service, Package, Category } from '@/types/database';

interface Props {
  services: Service[];
  packages: Package[];
  categories: Category[];
}

const RECENT_KEY = 'bfl_recent_searches';

export default function HeaderSearch({ services, packages, categories }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // ─── load recent searches ───
  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      if (raw) setRecentSearches(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  // ─── Cmd/Ctrl + K shortcut ───
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ─── focus input when opened ───
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // ─── search logic ───
  const q = query.trim().toLowerCase();
  const matchedServices = useMemo(() => {
    if (!q) return [];
    return services
      .filter((s) => {
        const haystack = `${s.name_ar} ${s.name_en} ${s.description_ar || ''}`.toLowerCase();
        return haystack.includes(q);
      })
      .slice(0, 8);
  }, [services, q]);

  const matchedPackages = useMemo(() => {
    if (!q) return [];
    return packages
      .filter((p) => {
        const haystack = `${p.name_ar} ${p.name_en || ''} ${p.description_ar || ''}`.toLowerCase();
        return haystack.includes(q);
      })
      .slice(0, 4);
  }, [packages, q]);

  const matchedCategories = useMemo(() => {
    if (!q) return [];
    return categories
      .filter((c) => {
        const haystack = `${c.name_ar} ${c.name_en || ''}`.toLowerCase();
        return haystack.includes(q);
      })
      .slice(0, 4);
  }, [categories, q]);

  const totalResults = matchedServices.length + matchedPackages.length + matchedCategories.length;

  // ─── flat results for keyboard nav ───
  const flatResults = useMemo(() => {
    const items: { type: 'service' | 'package' | 'category'; data: any }[] = [];
    matchedServices.forEach((s) => items.push({ type: 'service', data: s }));
    matchedPackages.forEach((p) => items.push({ type: 'package', data: p }));
    matchedCategories.forEach((c) => items.push({ type: 'category', data: c }));
    return items;
  }, [matchedServices, matchedPackages, matchedCategories]);

  useEffect(() => { setSelectedIdx(0); }, [q]);

  function goToResult(item: typeof flatResults[0]) {
    saveRecentSearch(q);
    if (item.type === 'service') router.push(`/services/${item.data.id}`);
    else if (item.type === 'package') router.push(`/booking?package=${item.data.id}`);
    else router.push(`/#services`);
    setOpen(false);
    setQuery('');
  }

  function saveRecentSearch(term: string) {
    if (!term.trim() || term.length < 2) return;
    try {
      const next = [term, ...recentSearches.filter((t) => t !== term)].slice(0, 5);
      setRecentSearches(next);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch { /* ignore */ }
  }

  function clearRecent() {
    setRecentSearches([]);
    try { localStorage.removeItem(RECENT_KEY); } catch { /* ignore */ }
  }

  function onInputKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, flatResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flatResults[selectedIdx]) goToResult(flatResults[selectedIdx]);
    }
  }

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/70 backdrop-blur-sm border border-gold-light/30 text-ink-soft hover:border-gold-light hover:bg-white hover:text-gold-deep transition-all text-sm"
        aria-label="بحث"
      >
        <Search className="w-4 h-4" />
        <span>بحث...</span>
        <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-cream-100 border border-cream-300 rounded text-[10px] font-en-display text-ink-soft">
          ⌘K
        </kbd>
      </button>

      {/* Mobile · أيقونة فقط */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="md:hidden w-10 h-10 rounded-full border border-gold-light/30 bg-white/70 text-gold-deep flex items-center justify-center hover:border-gold-light"
        aria-label="بحث"
      >
        <Search className="w-4 h-4" />
      </button>

      {/* ─── Overlay ─── */}
      {open && (
        <div
          className="fixed inset-0 z-[200] bg-ink/60 backdrop-blur-md flex items-start justify-center pt-16 md:pt-24 p-4 animate-fade-in"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Bar */}
            <div className="relative border-b border-cream-200">
              <Search className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gold-light pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onInputKey}
                placeholder="ابحثي عن خدمة · بكج · تصنيف..."
                className="w-full py-5 px-14 pr-14 text-base outline-none text-ink placeholder-ink-soft/60"
              />
              <button
                onClick={() => setOpen(false)}
                className="absolute left-5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-cream-100 hover:bg-cream-200 flex items-center justify-center text-ink-soft"
                aria-label="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Results */}
            <div className="max-h-[60vh] overflow-y-auto">

              {/* ─── Empty state (no query) · recent + popular ─── */}
              {!q && (
                <div className="p-5">
                  {recentSearches.length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <div className="font-en-label text-[10px] tracking-[0.3em] text-gold-light">
                          RECENT
                        </div>
                        <button
                          onClick={clearRecent}
                          className="text-[11px] text-ink-soft hover:text-rose-600"
                        >
                          مسح
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {recentSearches.map((t, i) => (
                          <button
                            key={i}
                            onClick={() => setQuery(t)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cream-100 hover:bg-gold-light/15 rounded-full text-xs text-ink hover:text-gold-deep transition-colors"
                          >
                            <Clock className="w-3 h-3" />
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="font-en-label text-[10px] tracking-[0.3em] text-gold-light mb-3">
                    POPULAR
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {services.slice(0, 4).map((s) => (
                      <Link
                        key={s.id}
                        href={`/services/${s.id}`}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 p-3 rounded-xl bg-cream-50 hover:bg-gold-light/10 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg bg-gold-light/15 flex items-center justify-center shrink-0">
                          <Sparkles className="w-4 h-4 text-gold-deep" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-xs text-ink truncate">{s.name_ar}</div>
                          <div className="text-[10px] text-ink-soft">
                            {formatPrice(s.price, { showFrom: s.price_from })}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>

                  {/* Shortcuts hint */}
                  <div className="mt-6 pt-5 border-t border-cream-200 flex items-center justify-center gap-4 text-[11px] text-ink-soft">
                    <span className="inline-flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-cream-100 border border-cream-300 rounded text-[9px] font-en-display">↑↓</kbd>
                      للتنقّل
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-cream-100 border border-cream-300 rounded text-[9px] font-en-display">↵</kbd>
                      للفتح
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-cream-100 border border-cream-300 rounded text-[9px] font-en-display">esc</kbd>
                      للإغلاق
                    </span>
                  </div>
                </div>
              )}

              {/* ─── Results ─── */}
              {q && totalResults === 0 && (
                <div className="p-8 text-center">
                  <div className="w-14 h-14 mx-auto rounded-full bg-cream-100 flex items-center justify-center mb-3">
                    <Search className="w-6 h-6 text-ink-soft" />
                  </div>
                  <div className="font-bold text-ink mb-1">ما لقينا نتائج لـ "<span className="text-gold-deep">{query}</span>"</div>
                  <div className="text-xs text-ink-soft">جرّبي كلمة أخرى · أو تواصلي معنا</div>
                </div>
              )}

              {q && totalResults > 0 && (
                <div className="p-3">
                  {matchedCategories.length > 0 && (
                    <ResultSection title="تصنيفات">
                      {matchedCategories.map((c, i) => {
                        const globalIdx = i;
                        return (
                          <ResultRow
                            key={c.id}
                            icon={Tag}
                            color="violet"
                            title={c.name_ar}
                            subtitle={c.name_en || ''}
                            onClick={() => goToResult({ type: 'category', data: c })}
                            selected={globalIdx === selectedIdx}
                          />
                        );
                      })}
                    </ResultSection>
                  )}

                  {matchedServices.length > 0 && (
                    <ResultSection title="خدمات">
                      {matchedServices.map((s, i) => {
                        const globalIdx = matchedCategories.length + matchedPackages.length + i;
                        return (
                          <ResultRow
                            key={s.id}
                            icon={Sparkles}
                            color="gold"
                            title={s.name_ar}
                            subtitle={`${formatDuration(s.duration_min)} · ${formatPrice(s.price, { showFrom: s.price_from })}`}
                            onClick={() => goToResult({ type: 'service', data: s })}
                            selected={globalIdx === selectedIdx}
                          />
                        );
                      })}
                    </ResultSection>
                  )}

                  {matchedPackages.length > 0 && (
                    <ResultSection title="بكجات">
                      {matchedPackages.map((p, i) => {
                        const globalIdx = matchedCategories.length + i;
                        return (
                          <ResultRow
                            key={p.id}
                            icon={PkgIcon}
                            color="rose"
                            title={p.name_ar}
                            subtitle={formatPrice(p.price)}
                            onClick={() => goToResult({ type: 'package', data: p })}
                            selected={globalIdx === selectedIdx}
                          />
                        );
                      })}
                    </ResultSection>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ResultSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="font-en-label text-[9px] tracking-[0.3em] text-gold-light px-3 py-1.5">
        {title.toUpperCase()}
      </div>
      <div className="space-y-0.5">
        {children}
      </div>
    </div>
  );
}

function ResultRow({
  icon: Icon, color, title, subtitle, onClick, selected,
}: {
  icon: any; color: 'gold' | 'rose' | 'violet';
  title: string; subtitle: string;
  onClick: () => void; selected?: boolean;
}) {
  const colors = {
    gold:   'bg-gold-light/15 text-gold-deep',
    rose:   'bg-rose-100 text-rose-700',
    violet: 'bg-violet-100 text-violet-700',
  }[color];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-right transition-colors ${
        selected ? 'bg-gold-light/15' : 'hover:bg-cream-50'
      }`}
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${colors}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0 text-right">
        <div className="font-bold text-sm text-ink truncate">{title}</div>
        <div className="text-[11px] text-ink-soft truncate">{subtitle}</div>
      </div>
    </button>
  );
}
