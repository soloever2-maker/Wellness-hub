import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { PWAInit } from '@/components/pwa-init'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Align with Enjy',
  description: 'Wellness & Yoga Center — Ladies Only. Book your class with trainer Enjy Gebril in 6th of October, Giza.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Align with Enjy',
  },
  formatDetection: { telephone: false },
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
  openGraph: {
    type: 'website',
    title: 'Align with Enjy',
    description: 'Wellness & Yoga Center — Ladies Only',
    siteName: 'Align with Enjy',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#006D77',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`light ${geistSans.variable} ${geistMono.variable} bg-background`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Align with Enjy" />
        <meta name="application-name" content="Align with Enjy" />
      </head>
      <body className="font-sans antialiased">
        <PWAInit />
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
