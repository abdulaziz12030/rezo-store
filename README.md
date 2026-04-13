# Rezo Store Starter

نسخة مبدئية لمتجر Rezo مبنية على Next.js ومهيأة للنشر على Vercel.

## أهم التحديثات في هذه النسخة
- ترقية Next.js إلى إصدار آمن ومتوافق مع Vercel.
- استبدال الصور الخارجية بصور محلية داخل `public/images`.
- فصل صورة البنر الرئيسية في المسار `public/images/hero/rezo-hero.svg`.
- تنظيم صور المنتجات داخل `public/images/products`.

## كيف تستبدل الصور بصورك الحقيقية
1. افتح المجلد `public/images/products`.
2. استبدل كل صورة بنفس الاسم الحالي، أو عدّل المسار من `src/lib/data.ts`.
3. لاستبدال البنر الرئيسي، غيّر الملف `public/images/hero/rezo-hero.svg` أو حدّث مساره من `heroBanner.image` داخل `src/lib/data.ts`.

## التشغيل المحلي
```bash
npm install
npm run dev
```

## البناء
```bash
npm run build
```
