import type { Metadata, Viewport } from 'next'
import ClientLayout from './ClientLayout'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'Oscillo - Interactive Music 3D',
  description: 'Create fluid, immersive music experiences through interactive 3D environments',
  manifest: '/manifest.json',
  icons: {
    icon: '/oscillo-logo.png',
    apple: '/oscillo-logo.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#111111',
}

export default function RootLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full w-full">
      <body className="h-full w-full relative">
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  )
}
