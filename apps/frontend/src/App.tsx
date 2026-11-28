import { useEffect, useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { getPage, pages } from './navigation'
import './App.css'

export default function App() {
  const [page, setPage] = useState(getPage)

  useEffect(() => {
    const syncPage = () => setPage(getPage())
    window.addEventListener('hashchange', syncPage)
    return () => window.removeEventListener('hashchange', syncPage)
  }, [])

  const activePage = pages[page]
  const { title, Component } = activePage

  useEffect(() => {
    document.title = `${title} | CinFarm`
  }, [title])

  return (
    <div className="app">
      <Sidebar page={page} />
      <main className="workspace">
        <div className="content">
          <header className="page-header">
            <h1>{title}</h1>
            {'description' in activePage && <p>{activePage.description}</p>}
          </header>
          <Component key={page} />
        </div>
      </main>
    </div>
  )
}
