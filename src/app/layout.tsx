import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../index.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Easy Marketing Automation',
  description: 'Find and Message Your First Customers on Reddit – Instantly',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className} style={{ width: '100%', margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  )
} 