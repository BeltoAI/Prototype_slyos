import './globals.css'
export const metadata = { title:'SlyOS (Mongo)' }
export default function Root({children}){
  return (
    <html>
      <body>
        <header className="header">
          <div className="header-inner">
            <div className="flex items-center gap-3">
              <img src="/SlyOS.png" alt="SlyOS" width="28" height="28" className="rounded" />
              <strong className="tracking-wide">SlyOS</strong>
            </div>
            <nav className="flex gap-2 text-sm">
              <a className="btn" href="/">Dashboard</a>
              <a className="btn" href="/admin">Admin</a>
              <a className="btn" href="/auth">Login</a>
            </nav>
          </div>
        </header>
        <main className="container py-6">{children}</main>
      </body>
    </html>
  )
}
