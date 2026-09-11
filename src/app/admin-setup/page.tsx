import Link from 'next/link'
import { redirect } from 'next/navigation'
import { bootstrapFirstAdmin } from '@/lib/actions/admin-setup'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const errorMessages: Record<string, string> = {
  environment: 'بيئة REZO STYLE غير مربوطة بـ Supabase بعد.',
  disabled: 'تهيئة أول مدير متوقفة حتى يتم إعداد رمز التهيئة السري في بيئة التشغيل.',
  missing: 'أكمل جميع الحقول المطلوبة.',
  password: 'استخدم كلمة مرور من 12 خانة على الأقل.',
  token: 'رمز التهيئة غير صحيح.',
  create: 'تعذر إنشاء حساب Owner أو إرسال رسالة التحقق. تحقق من إعدادات Auth في Supabase ثم حاول مجددًا.',
  'confirmation-disabled': 'تأكيد البريد الإلكتروني غير مفعّل في Supabase. تم إلغاء إنشاء الحساب لحمايته؛ فعّل Email Confirmations ثم أعد المحاولة.',
  database: 'تعذر إكمال التهيئة بسبب خطأ في قاعدة البيانات.'
}

export default async function AdminSetupPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  const message = error ? errorMessages[error] : null
  const configured = isSupabaseConfigured()
  const setupEnabled = Boolean(process.env.REZO_STYLE_ADMIN_SETUP_TOKEN)

  if (configured) {
    const supabase = getSupabaseAdmin()
    const { count } = await supabase.from('admin_users').select('user_id', { count: 'exact', head: true })
    if ((count ?? 0) > 0) redirect('/admin-login?setup=closed')
  }

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-16">
      <div className="mx-auto max-w-md rounded-[32px] bg-white p-8 shadow-soft">
        <div className="text-center">
          <p className="text-xs font-bold tracking-[0.3em] text-brand-gold">REZO STYLE</p>
          <h1 className="mt-3 text-3xl font-bold text-brand-navy">تهيئة أول مدير</h1>
          <p className="mt-3 text-sm leading-6 text-stone-600">
            تعمل هذه الصفحة مرة واحدة فقط. سننشئ Owner بحالة انتظار التحقق، ثم يرسل Supabase رسالة تأكيد إلى البريد قبل السماح بالدخول.
          </p>
        </div>

        {message ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">{message}</div>
        ) : null}

        {!configured || !setupEnabled ? (
          <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-900">
            {!configured
              ? 'سنفعّل هذه الصفحة بعد ربط بيئة النشر المستقلة الخاصة بـ REZO STYLE بمشروع Supabase.'
              : 'قاعدة البيانات جاهزة، وتبقى إضافة رمز REZO_STYLE_ADMIN_SETUP_TOKEN إلى بيئة النشر قبل إنشاء الحساب الأول.'}
          </div>
        ) : (
          <form action={bootstrapFirstAdmin} className="mt-8 grid gap-5">
            <label className="grid gap-2 text-sm font-medium text-stone-700">
              البريد الإلكتروني للمالك
              <input name="email" type="email" autoComplete="email" required defaultValue="style@rezo.sa" className="rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-brand-gold" />
            </label>

            <label className="grid gap-2 text-sm font-medium text-stone-700">
              كلمة المرور
              <input name="password" type="password" minLength={12} autoComplete="new-password" required className="rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-brand-gold" />
              <span className="text-xs text-stone-500">12 خانة على الأقل. لن تعمل للدخول حتى يتم تأكيد البريد.</span>
            </label>

            <label className="grid gap-2 text-sm font-medium text-stone-700">
              رمز التهيئة السري
              <input name="setup_token" type="password" autoComplete="off" required className="rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-brand-gold" />
            </label>

            <div className="rounded-2xl bg-brand-sand/60 p-4 text-sm leading-7 text-stone-700">
              بعد الضغط سيصل إلى <strong>style@rezo.sa</strong> بريد من Supabase لتأكيد العنوان. لا تحاول تسجيل الدخول قبل الضغط على رابط التأكيد.
            </div>

            <button className="rounded-full bg-brand-navy px-6 py-3 font-bold text-white transition hover:opacity-90">إنشاء Owner وإرسال التحقق</button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link href="/admin-login" className="text-sm font-semibold text-stone-500 hover:text-brand-navy">العودة إلى دخول الإدارة</Link>
        </div>
      </div>
    </main>
  )
}
