import './globals.css'
import Link from 'next/link'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <nav style={styles.nav}>
          <Link href="/" style={styles.logo}>
            🛒 Shop App
          </Link>
        </nav>

        <main style={styles.main}>
          {children}
        </main>
      </body>
    </html>
  )
}

const styles = {
  nav: {
    padding: '15px 30px',
    borderBottom: '1px solid #e5e7eb',
    backgroundColor: 'white'
  },
  logo: {
    fontWeight: 'bold',
    fontSize: '18px',
    textDecoration: 'none',
    color: '#111827',
    cursor: 'pointer'
  },
  main: {
    padding: '20px'
  }
}