'use client';

import { Printer } from 'lucide-react';

export default function InvoicePrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="btn-primary flex items-center gap-2 !py-2 text-sm"
    >
      <Printer className="w-4 h-4" />
      طباعة
    </button>
  );
}
