import Link from 'next/link'
import { adminLogin } from '@/lib/actions/admin-auth'

const errorMessages: Record<string, string> = {
  missing: 'أدخل البريد الإلكتروني وكلمة المرور.',
  invalid: 'بيانات الدخول غير صحيحة.',
  unauthorized: 'هذا الحساب لا يملك صلاحية إدارة REZO STYLE.'
}

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  const message = error ? errorMessages[error] : null

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-16">
      <div className="mx-auto max-w-md rounded-[32px] bg-white p-8 shadow-soft">
        <div className="text-center">
          <p className="text-xs font-bold tracking-[0.3em] text-brand-gold">REZO STYLE</p>
          <h1 className="mt-3 text-3xl font-bold text-brand-navy">دخول الإدارة</h1>
          <p className="mt-3 text-sm leading-6 text-stone-600">هذه الصفحة مخصصة لحسابات الإدارة المعتمدة فقط.</p>
        </div>

        {message ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{message}</div>
        ) : null}

        <form action={adminLogin} className="mt-8 grid gap-5">
          <label className="grid gap-2 text-sm font-medium text-stone-700">
            البريد الإلكتروني
            <input name="email" type="email" autoComplete="email" required className="rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-brand-gold" />
          </label>

          <label className="grid gap-2 text-sm font-medium text-stone-700">
            كلمة المرور
            <input name="password" type="password" autoComplete="current-password" required className="rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-brand-gold" />
          </label>

          <button className="rounded-full bg-brand-navy px-6 py-3 font-bold text-white transition hover:opacity-90">دخول لوحة التحكم</button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm font-semibold text-stone-500 hover:text-brand-navy">العودة إلى المتجر</Link>
        </div>
      </div>
    </main>
  )
}
