/**
 * InvoicePrintButton — زر طباعة/حفظ PDF للفاتورة
 */
'use client';

import { Printer, Download } from 'lucide-react';

export default function InvoicePrintButton() {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => window.print()}
        className="inline-flex items-center gap-2 bg-ink text-cream-50 hover:bg-ink/90 rounded-xl px-4 py-2.5 text-sm font-bold"
        style={{ minHeight: '44px' }}
      >
        <Download className="w-4 h-4" />
        تحميل PDF
      </button>
    </div>
  );
}
