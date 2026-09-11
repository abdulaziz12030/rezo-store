'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  orderNumber: string
  accessToken: string
  orderStatus: string
  paymentStatus: string
  paymentReturn?: string
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function invokePaymentFunction(name: string, payload: Record<string, string>) {
  if (!supabaseUrl || !publishableKey) throw new Error('payment_environment_missing')

  const response = await fetch(`${supabaseUrl}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': publishableKey
    },
    body: JSON.stringify(payload)
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(String(data?.error || `payment_http_${response.status}`))
  return data
}

export function OrderPaymentPanel({ orderNumber, accessToken, orderStatus, paymentStatus, paymentReturn }: Props) {
  const router = useRouter()
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const reconciled = useRef(false)
  const environmentReady = Boolean(supabaseUrl && publishableKey)

  function reconcile() {
    startTransition(async () => {
      try {
        setMessage('جاري التحقق من حالة الدفع لدى ميسر…')
        const result = await invokePaymentFunction('rezo-style-reconcile-moyasar-invoice', {
          order_number: orderNumber,
          access_token: accessToken
        })

        if (result.status === 'paid') {
          setMessage('تم تأكيد الدفع بنجاح.')
          router.refresh()
          return
        }

        if (['expired', 'cancelled', 'failed'].includes(String(result.status))) {
          setMessage('انتهت محاولة الدفع أو أُلغيت، وتم تحديث حالة الطلب.')
          router.refresh()
          return
        }

        setMessage('الدفع لم يُؤكد بعد. يمكنك المحاولة مرة أخرى أو تحديث الحالة بعد قليل.')
      } catch {
        setMessage('تعذر التحقق من الدفع الآن. لم يتم تغيير حالة الطلب.')
      }
    })
  }

  useEffect(() => {
    if (paymentReturn === 'success' && paymentStatus !== 'paid' && environmentReady && !reconciled.current) {
      reconciled.current = true
      reconcile()
    }
  }, [paymentReturn, paymentStatus, environmentReady])

  function pay() {
    startTransition(async () => {
      try {
        setMessage('جاري تجهيز رابط الدفع الآمن…')
        const result = await invokePaymentFunction('rezo-style-create-moyasar-invoice', {
          order_number: orderNumber,
          access_token: accessToken
        })

        if (result.status === 'paid') {
          setMessage('هذا الطلب مدفوع بالفعل.')
          router.refresh()
          return
        }

        if (!result.payment_url) throw new Error('payment_url_missing')
        window.location.assign(String(result.payment_url))
      } catch (error) {
        const code = error instanceof Error ? error.message : ''
        if (code === 'reservation_expired' || code === 'order_cancelled') {
          setMessage('انتهت مهلة حجز المخزون لهذا الطلب. أنشئ طلبًا جديدًا للمتابعة.')
          router.refresh()
          return
        }
        setMessage('تعذر إنشاء رابط الدفع حاليًا. لم يتم خصم أي مبلغ.')
      }
    })
  }

  if (paymentStatus === 'paid') {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
        تم تأكيد الدفع إلكترونيًا، والطلب جاهز للانتقال إلى مرحلة التجهيز.
      </div>
    )
  }

  if (orderStatus === 'cancelled') {
    return (
      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700">
        هذا الطلب ملغي ولا يقبل دفعات جديدة.
      </div>
    )
  }

  return (
    <div className="space-y-4 rounded-2xl border border-stone-200 bg-stone-50 p-5">
      <div>
        <div className="font-bold text-brand-navy">الدفع الإلكتروني</div>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          سيتم تحويلك إلى صفحة ميسر الآمنة، وتظهر فيها طرق الدفع المفعلة لحساب المتجر.
        </p>
      </div>

      {!environmentReady ? (
        <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
          تكامل الدفع جاهز على فرع التطوير، وينتظر إعداد بيئة REZO STYLE ومفاتيح ميسر قبل الاختبار الفعلي.
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={pay}
            disabled={isPending}
            className="rounded-full bg-brand-navy px-6 py-3 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-50"
          >
            {isPending ? 'جاري المعالجة…' : 'الدفع عبر ميسر'}
          </button>
          <button
            type="button"
            onClick={reconcile}
            disabled={isPending}
            className="rounded-full border border-brand-navy px-6 py-3 text-sm font-bold text-brand-navy disabled:opacity-50"
          >
            تحديث حالة الدفع
          </button>
        </div>
      )}

      {message ? <div className="text-sm font-medium text-stone-700">{message}</div> : null}
    </div>
  )
}
