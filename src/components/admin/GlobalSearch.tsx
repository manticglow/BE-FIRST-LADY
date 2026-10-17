@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    -webkit-text-size-adjust: 100%;
    scroll-behavior: smooth;
  }
  body {
    @apply font-ar-body text-ink bg-cream-100 antialiased;
    min-height: 100vh;
    overflow-x: hidden;
  }
  :lang(en), [dir="ltr"] {
    @apply font-en-display;
  }
  h1, h2, h3, h4 {
    @apply font-ar-display font-bold text-gold-deep;
    line-height: 1.3;
  }
  button {
    @apply font-ar-body;
  }
}

@layer components {
  .container-brand {
    @apply max-w-6xl mx-auto px-5;
  }
  .btn-primary {
    @apply inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full
           bg-gold-gradient text-cream-50 font-bold shadow-gold
           transition-transform duration-300 ease-bounce hover:-translate-y-0.5;
  }
  .btn-outline {
    @apply inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full
           border border-gold-light/40 text-gold-deep font-bold
           transition-colors duration-300 hover:bg-cream-50;
  }
  .section-pad {
    @apply py-16 md:py-24;
  }
  .heading-eyebrow {
    @apply inline-block font-en-label text-xs tracking-[0.3em] text-gold-light uppercase;
  }
  .heading-title {
    @apply font-ar-display text-3xl md:text-5xl font-bold text-gold-deep leading-tight;
  }
  .divider-gold {
    @apply block w-16 h-px mx-auto my-4 bg-gradient-to-r from-transparent via-gold-light to-transparent;
  }
}

/* إخفاء شريط التمرير مع إبقاء التمرير شغّال · مفيد للـchips الأفقية */
@layer utilities {
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
}
