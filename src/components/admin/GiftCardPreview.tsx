'use client';

/**
 * GiftCardPreview — عرض بطاقة الهديّة بتصميم فاخر + تحميل PNG/PDF
 * ═══════════════════════════════════════════════════════════
 * - 3 تصاميم: gold · pink · floral
 * - تحميل كـPNG (للواتساب/الـstory)
 * - تحميل كـPDF (A4 · للطباعة)
 * - مشاركة واتساب جاهزة
 */
import { useRef, useState } from 'react';
import {
  Download, FileText, MessageCircle, Loader2, Sparkles, Scissors,
} from 'lucide-react';

export interface GiftCardData {
  code: string;
  amount: number;
  recipient_name: string;
  recipient_phone?: string;
  message?: string | null;
  design: 'gold' | 'pink' | 'floral';
  expires_at?: string | null;
}

export default function GiftCardPreview({ card }: { card: GiftCardData }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<'png' | 'pdf' | null>(null);

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(card.code)}&color=0a0a0a&bgcolor=ffffff&margin=10`;

  const downloadPng = async () => {
    if (!cardRef.current) return;
    setBusy('png');
    try {
      const html2canvas = (await import('html2canvas-pro')).default;
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        backgroundColor: null,
        useCORS: true,
        logging: false,
      });
      const link = document.createElement('a');
      link.download = `gift-card-${card.code}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error(e);
      alert('فشل تحميل الصورة · جرّبي مرة ثانية');
    } finally {
      setBusy(null);
    }
  };

  const downloadPdf = async () => {
    if (!cardRef.current) return;
    setBusy('pdf');
    try {
      const [html2canvasMod, jsPdfMod] = await Promise.all([
        import('html2canvas-pro'),
        import('jspdf'),
      ]);
      const html2canvas = html2canvasMod.default;
      const { jsPDF } = jsPdfMod;

      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        backgroundColor: null,
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');

      // A4 Portrait: 210x297mm · البطاقة نسبة 85x55 (نسبة بطاقة الائتمان)
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = 210;
      const cardW = 170;              // عرض البطاقة
      const cardH = (cardW * canvas.height) / canvas.width;
      const x = (pageWidth - cardW) / 2;
      const y = 40;

      // عنوان في أعلى الصفحة
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(18);
      pdf.setTextColor(60, 50, 40);
      pdf.text('Be First Lady', pageWidth / 2, 20, { align: 'center' });
      pdf.setFontSize(10);
      pdf.setTextColor(140, 130, 120);
      pdf.text('Luxury Gift Card', pageWidth / 2, 27, { align: 'center' });

      // البطاقة
      pdf.addImage(imgData, 'PNG', x, y, cardW, cardH);

      // تعليمات أسفل البطاقة
      const instrY = y + cardH + 15;
      pdf.setFontSize(9);
      pdf.setTextColor(100, 90, 80);
      pdf.text('Scan QR code at the salon · or present the code', pageWidth / 2, instrY, { align: 'center' });
      pdf.text(`Code: ${card.code}`, pageWidth / 2, instrY + 6, { align: 'center' });

      // ختم
      pdf.setFontSize(7);
      pdf.setTextColor(170, 160, 150);
      pdf.text('Be First Lady · Madinah, Saudi Arabia', pageWidth / 2, 287, { align: 'center' });

      pdf.save(`gift-card-${card.code}.pdf`);
    } catch (e) {
      console.error(e);
      alert('فشل تحميل الـPDF · جرّبي مرة ثانية');
    } finally {
      setBusy(null);
    }
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(
      `🎁 بطاقة هديّة فاخرة من Be First Lady\n\n` +
      `عزيزتي ${card.recipient_name}،\n` +
      (card.message ? `\n${card.message}\n` : '') +
      `\n💎 قيمة البطاقة: ${card.amount} ر.س` +
      `\n🔑 الكود: ${card.code}` +
      (card.expires_at ? `\n📅 صالحة حتى: ${new Date(card.expires_at).toLocaleDateString('ar-SA')}` : '') +
      `\n\nاستخدمي الكود عند الحجز أو الزيارة ✨`
    );
    const phone = card.recipient_phone?.replace(/[^0-9]/g, '') || '';
    const url = phone
      ? `https://wa.me/${phone}?text=${text}`
      : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-5">

      {/* ─── Preview Card ─── */}
      <div className="flex justify-center">
        <div
          ref={cardRef}
          className="relative"
          style={{ width: 420, maxWidth: '100%' }}
        >
          <GiftCardArtwork card={card} qrUrl={qrUrl} />
        </div>
      </div>

      {/* ─── Actions ─── */}
      <div className="grid grid-cols-3 gap-2.5">
        <button
          onClick={downloadPng}
          disabled={busy !== null}
          className="bg-gradient-to-br from-stone-800 to-stone-900 text-white rounded-xl py-3 px-3 text-xs font-bold hover:shadow-lg transition-all disabled:opacity-50 flex flex-col items-center gap-1.5"
        >
          {busy === 'png'
            ? <Loader2 className="w-5 h-5 animate-spin" />
            : <Download className="w-5 h-5" />}
          تحميل PNG
          <span className="text-[9px] opacity-70 font-normal">للواتساب</span>
        </button>

        <button
          onClick={downloadPdf}
          disabled={busy !== null}
          className="bg-gradient-to-br from-amber-700 to-amber-800 text-white rounded-xl py-3 px-3 text-xs font-bold hover:shadow-lg transition-all disabled:opacity-50 flex flex-col items-center gap-1.5"
        >
          {busy === 'pdf'
            ? <Loader2 className="w-5 h-5 animate-spin" />
            : <FileText className="w-5 h-5" />}
          تحميل PDF
          <span className="text-[9px] opacity-70 font-normal">للطباعة</span>
        </button>

        <button
          onClick={shareWhatsApp}
          disabled={busy !== null}
          className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-xl py-3 px-3 text-xs font-bold hover:shadow-lg transition-all disabled:opacity-50 flex flex-col items-center gap-1.5"
        >
          <MessageCircle className="w-5 h-5" />
          واتساب
          <span className="text-[9px] opacity-70 font-normal">إرسال مباشر</span>
        </button>
      </div>

      {/* نصيحة */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-800 flex items-start gap-2">
        <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          <strong>نصيحة:</strong> اختاري PNG لإرسالها عبر الواتساب والـstory ·
          اختاري PDF لو تبين تطبعيها على ورق فاخر وتسلّميها شخصياً للعميلة.
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Gift Card Artwork · التصميم الفاخر
// ═══════════════════════════════════════════════════════════
function GiftCardArtwork({
  card, qrUrl,
}: {
  card: GiftCardData; qrUrl: string;
}) {
  const designs = {
    gold: {
      bg: 'linear-gradient(135deg, #1a1510 0%, #2a1f14 50%, #3a2a18 100%)',
      accent: '#d4b062',
      text: '#f5e8c8',
      sub: '#c9a85a',
      pattern: 'radial-gradient(circle at 20% 20%, rgba(212,176,98,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(212,176,98,0.1) 0%, transparent 50%)',
    },
    pink: {
      bg: 'linear-gradient(135deg, #3a1a20 0%, #4a2028 50%, #5a2838 100%)',
      accent: '#e8a4b4',
      text: '#faeef1',
      sub: '#d88a9c',
      pattern: 'radial-gradient(circle at 20% 20%, rgba(232,164,180,0.18) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(232,164,180,0.1) 0%, transparent 50%)',
    },
    floral: {
      bg: 'linear-gradient(135deg, #2a2520 0%, #3a3528 50%, #4a4530 100%)',
      accent: '#c4b588',
      text: '#f8f4e8',
      sub: '#b0a070',
      pattern: 'radial-gradient(circle at 30% 20%, rgba(196,181,136,0.2) 0%, transparent 40%), radial-gradient(circle at 70% 80%, rgba(196,181,136,0.15) 0%, transparent 40%)',
    },
  };
  const d = designs[card.design] || designs.gold;

  return (
    <div
      style={{
        background: d.bg,
        borderRadius: 24,
        padding: 28,
        aspectRatio: '85/55',
        position: 'relative',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        overflow: 'hidden',
      }}
    >
      {/* نقشة خلفيّة */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: d.pattern,
          pointerEvents: 'none',
        }}
      />

      {/* إطار ذهبي */}
      <div
        style={{
          position: 'absolute',
          inset: 10,
          border: `1px solid ${d.accent}40`,
          borderRadius: 18,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 14,
          border: `0.5px solid ${d.accent}60`,
          borderRadius: 16,
          pointerEvents: 'none',
        }}
      />

      {/* زخارف الزوايا */}
      <CornerOrnament pos="top-left" color={d.accent} />
      <CornerOrnament pos="top-right" color={d.accent} />
      <CornerOrnament pos="bottom-left" color={d.accent} />
      <CornerOrnament pos="bottom-right" color={d.accent} />

      {/* المحتوى */}
      <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div
            style={{
              fontSize: 9,
              letterSpacing: 4,
              color: d.sub,
              textTransform: 'uppercase',
              fontWeight: 300,
            }}
          >
            BE FIRST LADY
          </div>
          <div
            style={{
              fontSize: 10,
              letterSpacing: 6,
              color: d.accent,
              marginTop: 4,
              fontWeight: 400,
            }}
          >
            · LUXURY GIFT ·
          </div>
        </div>

        {/* Main Area · Amount + QR */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 }}>

          {/* Amount side */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, color: d.sub, marginBottom: 4, letterSpacing: 1 }}>
              قيمة البطاقة
            </div>
            <div style={{
              fontSize: 48,
              fontWeight: 700,
              color: d.text,
              lineHeight: 1,
              letterSpacing: -1,
              fontFamily: 'Georgia, serif',
            }}>
              {card.amount.toLocaleString('ar-SA')}
            </div>
            <div style={{
              fontSize: 11,
              color: d.accent,
              marginTop: 4,
              letterSpacing: 2,
              fontWeight: 500,
            }}>
              ر.س · SAR
            </div>

            <div style={{
              marginTop: 14,
              paddingTop: 10,
              borderTop: `0.5px solid ${d.accent}30`,
            }}>
              <div style={{ fontSize: 8, color: d.sub, marginBottom: 2, letterSpacing: 1 }}>
                إلى
              </div>
              <div style={{
                fontSize: 14,
                color: d.text,
                fontWeight: 500,
                letterSpacing: 0.5,
                lineHeight: 1.3,
              }}>
                {card.recipient_name}
              </div>
            </div>
          </div>

          {/* QR side */}
          <div style={{
            padding: 8,
            background: '#fff',
            borderRadius: 10,
            boxShadow: `0 0 0 1px ${d.accent}40`,
          }}>
            <img
              src={qrUrl}
              alt={card.code}
              crossOrigin="anonymous"
              style={{ display: 'block', width: 90, height: 90 }}
            />
            <div style={{
              fontSize: 8,
              textAlign: 'center',
              marginTop: 4,
              color: '#555',
              fontFamily: 'monospace',
              letterSpacing: 0.5,
            }}>
              {card.code}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          fontSize: 8,
          color: d.sub,
          textAlign: 'center',
          marginTop: 10,
          paddingTop: 8,
          borderTop: `0.5px solid ${d.accent}20`,
          letterSpacing: 1,
        }}>
          {card.expires_at
            ? `صالحة حتى ${new Date(card.expires_at).toLocaleDateString('ar-SA')}`
            : 'بلا تاريخ انتهاء'}
          <span style={{ margin: '0 8px', color: d.accent }}>·</span>
          Madinah · Saudi Arabia
        </div>
      </div>
    </div>
  );
}

function CornerOrnament({ pos, color }: { pos: string; color: string }) {
  const style: React.CSSProperties = {
    position: 'absolute',
    width: 20,
    height: 20,
    pointerEvents: 'none',
  };
  if (pos === 'top-left') { style.top = 20; style.left = 20; }
  if (pos === 'top-right') { style.top = 20; style.right = 20; }
  if (pos === 'bottom-left') { style.bottom = 20; style.left = 20; }
  if (pos === 'bottom-right') { style.bottom = 20; style.right = 20; }

  return (
    <div style={style}>
      <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M 2 2 L 8 2 M 2 2 L 2 8 M 2 2 L 5 5"
          stroke={color}
          strokeWidth="0.5"
          strokeLinecap="round"
          opacity="0.8"
          style={{
            transform: pos.includes('right') ? 'scaleX(-1)' : undefined,
            transformOrigin: 'center',
            ...(pos.includes('bottom') ? {
              transform: pos.includes('right')
                ? 'scale(-1,-1)'
                : 'scaleY(-1)',
              transformOrigin: 'center',
            } : {}),
          }}
        />
      </svg>
    </div>
  );
}
