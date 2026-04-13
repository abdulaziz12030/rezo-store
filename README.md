# Rezo Store

نسخة متجر Rezo مبنية على Next.js مع واجهة متجر عربية ولوحة تحكم أولية لإدارة التصنيفات والمنتجات وربط الصور عبر Supabase Storage.

## ما الذي تم تضمينه
- الصفحة الرئيسية مع فيديو البنر.
- صفحات المجموعات والمنتجات.
- لوحة تحكم `/admin`.
- إدارة التصنيفات: عرض + إضافة + تعديل.
- إدارة المنتجات: عرض + إضافة + تعديل.
- دعم رفع الصورة الرئيسية للمنتج إلى Supabase Storage.
- fallback محلي: إذا لم يتم ربط Supabase، سيستمر المتجر بالعمل على البيانات المحلية الحالية.

## التشغيل المحلي
```bash
npm install
npm run dev
```

## ربط Supabase
1. أنشئ مشروع Supabase.
2. انسخ `.env.example` إلى `.env.local`.
3. ضع القيم التالية:
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```
4. نفّذ SQL الموجود داخل `supabase/schema.sql` من SQL Editor.
5. أنشئ bucket عامة باسم `product-images`.

## ملاحظات مهمة
- لوحة التحكم الحالية غير محمية بتسجيل دخول بعد. هذه خطوة تالية.
- الطلبات، الدفع، الشحن، والعملاء لم يتم ربطها بعد.
- صور المنتجات داخل `public/images` ما زالت موجودة كنسخة احتياطية محلية.
