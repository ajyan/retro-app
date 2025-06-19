import './globals.css'

export const metadata = {
  title: 'Retro App',
  description: 'A retrospective application migrated from Create React App to Next.js',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
} 