import type { Metadata } from 'next'
import './globals.css'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { storeMeta } from '@/lib/data'

export const metadata: Metadata = {
  title: `${storeMeta.name} | متجر جلابيات فخم`,
  description: storeMeta.description
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  )
}
