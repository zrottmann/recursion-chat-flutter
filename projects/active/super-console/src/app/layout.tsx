import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AppwriteProvider } from '@/lib/appwrite-context'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Claude Super Console',
  description: 'Web-based console interface for Claude Code on Appwrite',
  icons: {
    icon: '/favicon.ico'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <AppwriteProvider>
          {children}
        </AppwriteProvider>
        
        {/* ADDITIVE: Mobile Enhancement Script (Console-Safe) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Console-safe mobile enhancements
              (function() {
                // Only apply if mobile device detected
                const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                if (!isMobile) return;
                
                // Add mobile enhancement CSS
                const style = document.createElement('style');
                style.textContent = \`
                  /* ADDITIVE mobile enhancements for console */
                  @media (max-width: 768px) {
                    /* Improve console touch targets */
                    button, [role="button"] {
                      min-height: 44px;
                      min-width: 44px;
                    }
                    
                    /* Console-specific mobile optimizations */
                    .terminal, [class*="terminal"] {
                      font-size: 14px;
                      touch-action: pan-y;
                    }
                    
                    /* Mobile navigation improvements */
                    .mobile-nav-enhancement {
                      -webkit-tap-highlight-color: rgba(255,255,255,0.1);
                    }
                  }
                  
                  /* iOS Safari console fixes */
                  @supports (-webkit-touch-callout: none) {
                    .xterm-viewport, [class*="terminal"] {
                      -webkit-overflow-scrolling: touch;
                    }
                  }
                \`;
                document.head.appendChild(style);
                
                // Console preservation check
                const preserveConsole = () => {
                  const consoleElements = document.querySelectorAll('.terminal, [class*="terminal"], [class*="console"]');
                  if (consoleElements.length > 0) {
                    console.log('🛡️ Console elements preserved during mobile enhancement');
                  }
                };
                
                // Apply enhancements after page load
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', preserveConsole);
                } else {
                  preserveConsole();
                }
              })();
            `,
          }}
        />
      </body>
    </html>
  )
}