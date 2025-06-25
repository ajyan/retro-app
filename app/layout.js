import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata = {
  title: 'Retro App',
  description: 'A retrospective application migrated from Create React App to Next.js',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable}`} suppressHydrationWarning>
      <head />
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
} 