import { isSupabaseConfigured } from '@/lib/supabase/server'

export function SetupNotice() {
  if (isSupabaseConfigured()) return null

  return (
    <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-900 shadow-soft">
      هذه اللوحة جاهزة، لكن الربط الفعلي يحتاج أولًا تعبئة قيم Supabase داخل <code>.env.local</code> ثم تنفيذ ملف SQL الموجود داخل <code>supabase/schema.sql</code> وإنشاء bucket باسم <code>product-images</code>.
    </div>
  )
}
