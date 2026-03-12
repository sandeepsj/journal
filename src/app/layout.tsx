import type { Metadata } from 'next'
import { Lora, Inter } from 'next/font/google'
import './globals.css'

const lora = Lora({
  variable: '--font-lora',
  subsets: ['latin'],
  display: 'swap',
})

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Muse — A space to remember yourself',
  description: 'A calming personal journal with AI-powered memory.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${lora.variable} ${inter.variable}`}>
      <body className="antialiased bg-[#FAF8F5] text-[#2C2825] font-sans">
        {children}
      </body>
    </html>
  )
}
