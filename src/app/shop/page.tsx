/**
 * /shop — المتجر الإلكتروني
 */
'use client';

import { useState, useEffect } from 'react';
import { ShoppingBag, Loader2, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import Link from 'next/link';

export default function ShopPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [q, setQ] = useState('');

  useEffect(() => { load(); }, [selectedCat]);

  async function load() {
    setLoading(true);
    const url = selectedCat ? `/api/shop/products?category=${selectedCat}` : '/api/shop/products';
    const r = await fetch(url);
    const d = await r.json();
    if (d.ok) {
      setProducts(d.products);
      setCategories(d.categories);
    }
    setLoading(false);
  }

  async function addToCart(id: string) {
    const r = await fetch('/api/shop/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: id, quantity: 1 }),
    });
    const d = await r.json();
    if (d.ok) toast.success('أُضيف للعربة 🛍');
    else toast.error(d.error || 'سجّلي دخول أوّل');
  }

  const filtered = q
    ? products.filter((p) => p.name_ar?.toLowerCase().includes(q.toLowerCase()) || p.brand?.toLowerCase().includes(q.toLowerCase()))
    : products;

  return (
    <div className="max-w-5xl mx-auto p-4 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 mt-2">
        <h1 className="font-ar-display text-2xl font-bold text-gold-deep flex items-center gap-2">
          <ShoppingBag className="w-6 h-6" />
          المتجر
        </h1>
        <Link href="/shop/cart" className="relative bg-cream-100 hover:bg-cream-200 w-10 h-10 rounded-full flex items-center justify-center">
          <ShoppingBag className="w-5 h-5 text-gold-deep" />
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-soft" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحثي عن منتج..." className="w-full pr-10 pl-4 py-3 rounded-2xl bg-white border border-cream-200 text-sm focus:outline-none focus:border-gold-light" />
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto mb-5 pb-1 -mx-4 px-4 scroll-smooth">
        <button onClick={() => setSelectedCat(null)} className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap ${!selectedCat ? 'bg-gold-deep text-white' : 'bg-white border border-cream-200 text-ink-soft'}`}>
          🌸 الكل
        </button>
        {categories.map((c) => (
          <button key={c.id} onClick={() => setSelectedCat(c.id)} className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap ${selectedCat === c.id ? 'bg-gold-deep text-white' : 'bg-white border border-cream-200 text-ink-soft'}`}>
            {c.icon} {c.name_ar}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gold-deep mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-cream-200">
          <ShoppingBag className="w-10 h-10 mx-auto text-ink-soft/40 mb-3" />
          <p className="text-ink-soft text-sm">لا توجد منتجات في هذا القسم حاليّاً</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl overflow-hidden border border-cream-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="aspect-square bg-cream-50 relative">
                {p.image_urls?.[0] ? (
                  <Image src={p.image_urls[0]} alt={p.name_ar} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl opacity-30">🌸</div>
                )}
                {p.compare_price && p.compare_price > p.price && (
                  <span className="absolute top-2 right-2 bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    -{Math.round((1 - p.price / p.compare_price) * 100)}%
                  </span>
                )}
              </div>
              <div className="p-3">
                <div className="text-[10px] text-ink-soft mb-1">{p.brand}</div>
                <h3 className="font-bold text-sm text-ink line-clamp-2 min-h-[2.5rem]">{p.name_ar}</h3>
                <div className="flex items-end justify-between mt-2">
                  <div>
                    {p.compare_price && p.compare_price > p.price && (
                      <div className="text-[10px] text-ink-soft line-through font-en-display">{Number(p.compare_price).toLocaleString('ar-SA')}</div>
                    )}
                    <div className="font-en-display font-bold text-gold-deep">{Number(p.price).toLocaleString('ar-SA')} ر.س</div>
                  </div>
                  <button onClick={() => addToCart(p.id)} className="bg-gold-deep hover:bg-gold-light text-white w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
