import Link from 'next/link'
import { redirect } from 'next/navigation'
import { bootstrapFirstAdmin } from '@/lib/actions/admin-setup'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const errorMessages: Record<string, string> = {
  environment: 'بيئة REZO STYLE غير مربوطة بـ Supabase بعد.',
  missing: 'أدخل كلمة المرور المطلوبة.',
  password: 'استخدم كلمة مرور من 12 خانة على الأقل.',
  create: 'تعذر إنشاء حساب Owner أو إرسال رسالة التحقق. تحقق من إعدادات Auth في Supabase ثم حاول مجددًا.',
  'confirmation-disabled': 'تأكيد البريد الإلكتروني غير مفعّل في Supabase. تم إلغاء إنشاء الحساب لحمايته؛ فعّل Email Confirmations ثم أعد المحاولة.',
  'existing-auth': 'يوجد مستخدم Auth سابق في REZO STYLE، لذلك أوقفنا التهيئة التلقائية حفاظًا على الأمان.',
  database: 'تعذر إكمال التهيئة بسبب خطأ في قاعدة البيانات.'
}

export default async function AdminSetupPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  const message = error ? errorMessages[error] : null
  const configured = isSupabaseConfigured()

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
            لا تحتاج الآن إلى أي رمز من Vercel. اختر كلمة مرور فقط، وسيُنشأ Owner للبريد الثابت style@rezo.sa ثم يرسل Supabase رسالة تأكيد إلى بريدك.
          </p>
        </div>

        {message ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">{message}</div>
        ) : null}

        {!configured ? (
          <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-900">
            بيئة REZO STYLE غير مربوطة بـ Supabase بعد.
          </div>
        ) : (
          <form action={bootstrapFirstAdmin} className="mt-8 grid gap-5">
            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm leading-7 text-stone-700">
              البريد المعتمد للمالك: <strong>style@rezo.sa</strong>
            </div>

            <label className="grid gap-2 text-sm font-medium text-stone-700">
              اختر كلمة المرور
              <input name="password" type="password" minLength={12} autoComplete="new-password" required className="rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-brand-gold" />
              <span className="text-xs text-stone-500">12 خانة على الأقل. لن تعمل للدخول حتى يتم تأكيد البريد.</span>
            </label>

            <div className="rounded-2xl bg-brand-sand/60 p-4 text-sm leading-7 text-stone-700">
              بعد الضغط سيصل إلى <strong>style@rezo.sa</strong> بريد من Supabase. افتح الرسالة واضغط رابط التأكيد، ثم سجّل الدخول بنفس كلمة المرور.
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
