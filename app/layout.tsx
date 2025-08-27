import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Console Appwrite Grok',
  description: 'AI-powered console with Grok integration',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body>{children}</body>
    </html>
  )
}