'use client';

/**
 * ShareButton — زر مشاركة فاخر مع قائمة قنوات
 * - Native Web Share API أولاً
 * - fallback: menu بـwhatsapp · copy · twitter · telegram · email
 */
import { useState } from 'react';
import { Share2, Copy, Check, MessageCircle, Send, Mail, X } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  title: string;
  text: string;
  url: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'ghost' | 'icon';
  className?: string;
  label?: string;
}

export default function ShareButton({
  title, text, url, size = 'md', variant = 'ghost', className = '', label = 'شاركي',
}: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  async function nativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return true;
      } catch { /* user cancelled */ }
    }
    return false;
  }

  async function handleClick() {
    const ok = await nativeShare();
    if (!ok) setOpen(true);
  }

  function copyUrl() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('نُسخ الرابط ✓');
    setTimeout(() => setCopied(false), 2000);
  }

  const sizeClass = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  }[size];

  const iconSize = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }[size];

  // ─── Button Styles ───
  const btnBase = variant === 'solid'
    ? 'bg-gradient-to-br from-gold-deep to-ink text-cream-50 shadow-md'
    : variant === 'ghost'
      ? 'bg-white border border-gold-light/30 text-gold-deep hover:border-gold-light hover:bg-gold-light/5'
      : 'bg-transparent text-gold-deep hover:bg-gold-light/10';

  const whatsappText = encodeURIComponent(`${text}\n\n${url}`);
  const whatsappUrl = `https://wa.me/?text=${whatsappText}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  const mailUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${text}\n\n${url}`)}`;

  return (
    <>
      {variant === 'icon' ? (
        <button
          type="button"
          onClick={handleClick}
          className={`${sizeClass} rounded-full flex items-center justify-center transition-all ${btnBase} ${className}`}
          aria-label={label}
        >
          <Share2 className={iconSize} />
        </button>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${btnBase} ${className}`}
        >
          <Share2 className={iconSize} />
          {label}
        </button>
      )}

      {/* ─── Modal ─── */}
      {open && (
        <div
          className="fixed inset-0 z-[9999] bg-ink/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative bg-gradient-to-br from-gold-deep via-ink to-gold-deep text-cream-50 p-5">
              <button
                onClick={() => setOpen(false)}
                className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="editorial-eyebrow text-white/60 mb-1">SHARE</div>
              <div className="font-ar-display font-bold text-lg flex items-center gap-2">
                <Share2 className="w-5 h-5" />
                شاركي مع صديقاتك
              </div>
            </div>

            {/* Channels Grid */}
            <div className="p-5">
              <div className="grid grid-cols-4 gap-3 mb-4">
                <ChannelButton
                  icon={MessageCircle}
                  label="واتساب"
                  href={whatsappUrl}
                  color="emerald"
                />
                <ChannelButton
                  icon={Send}
                  label="تلقرام"
                  href={telegramUrl}
                  color="sky"
                />
                <ChannelButton
                  icon={Mail}
                  label="إيميل"
                  href={mailUrl}
                  color="amber"
                />
                <ChannelButton
                  icon={copied ? Check : Copy}
                  label={copied ? 'منسوخ' : 'نسخ الرابط'}
                  onClick={copyUrl}
                  color={copied ? 'emerald' : 'stone'}
                />
              </div>

              {/* URL preview */}
              <div className="bg-cream-50 border border-cream-200 rounded-xl p-3 flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-ink-soft mb-0.5">الرابط</div>
                  <div className="text-xs font-en-display text-ink truncate" dir="ltr">
                    {url}
                  </div>
                </div>
                <button
                  onClick={copyUrl}
                  className="shrink-0 w-9 h-9 rounded-lg bg-gold-deep text-cream-50 flex items-center justify-center hover:bg-ink transition-colors"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ChannelButton({
  icon: Icon, label, href, onClick, color,
}: {
  icon: any; label: string; href?: string; onClick?: () => void;
  color: 'emerald' | 'sky' | 'amber' | 'stone';
}) {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
    sky:     'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100',
    amber:   'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
    stone:   'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100',
  }[color];

  const content = (
    <>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center">
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-[10px] font-bold">{label}</span>
    </>
  );

  const className = `flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all ${colors}`;

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener"
        className={className}
      >
        {content}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}
