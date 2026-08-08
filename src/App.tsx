import { useState } from 'react'
import { modules } from './modules'

function App() {
  const [activeId, setActiveId] = useState(modules[0].id)
  const ActiveModule = modules.find((m) => m.id === activeId)?.component ?? modules[0].component

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-xl font-bold">Engineering Calculator</h1>
      </header>

      <nav className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-6 py-2 dark:border-slate-800 dark:bg-slate-900">
        {modules.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setActiveId(m.id)}
            className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              m.id === activeId
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            {m.label}
          </button>
        ))}
      </nav>

      <main className="px-6 py-8">
        <ActiveModule />
      </main>
    </div>
  )
}

export default App
