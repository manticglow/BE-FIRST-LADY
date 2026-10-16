#!/bin/bash
# ═══════════════════════════════════════════════════════════
# Be First Lady — Mobile App Quick Setup
# ═══════════════════════════════════════════════════════════

set -e

echo "🌸 Be First Lady — إعداد تطبيق الموبايل"
echo "═══════════════════════════════════════════"
echo ""

# التحقق من Node + npm
if ! command -v node &> /dev/null; then
  echo "❌ Node.js غير مثبّت. حمّليه من: https://nodejs.org"
  exit 1
fi

echo "✅ Node $(node -v) موجود"

# التحقق من Capacitor CLI
if ! command -v cap &> /dev/null; then
  echo "📦 تثبيت Capacitor CLI..."
  npm install -g @capacitor/cli
fi

# تثبيت الحزم
echo ""
echo "📦 تثبيت حزم المشروع..."
npm install --legacy-peer-deps

# توليد أيقونات
if [ ! -d "node_modules/@capacitor/assets" ]; then
  echo "📦 تثبيت مولّد الأيقونات..."
  npm install --save-dev @capacitor/assets --legacy-peer-deps
fi

# تذكير
echo ""
echo "═══════════════════════════════════════════"
echo "✅ الإعداد الأساسي اكتمل"
echo "═══════════════════════════════════════════"
echo ""
echo "📱 الخطوات التالية:"
echo ""
echo "  1️⃣  بدّلي الدومين في capacitor.config.ts"
echo "  2️⃣  شغّلي: npm run mobile:add:android"
echo "  3️⃣  شغّلي: npm run mobile:add:ios  (Mac فقط)"
echo "  4️⃣  شغّلي: npm run mobile:assets"
echo "  5️⃣  افتحي في IDE:"
echo "       Android: npm run mobile:open:android"
echo "       iOS:     npm run mobile:open:ios"
echo ""
echo "📖 الدليل الكامل: docs/MOBILE_APP_PUBLISHING.md"
echo ""
