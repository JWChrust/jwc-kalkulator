import { Fragment, useState } from 'react'
import { modules } from './modules'

function App() {
  const [activeId, setActiveId] = useState(modules[0].id)
  const activeModule = modules.find((m) => m.id === activeId) ?? modules[0]
  const LeftPane = activeModule.panes.left
  const CenterPane = activeModule.panes.center
  const RightPane = activeModule.panes.right
  const Provider = activeModule.provider ?? Fragment

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center gap-4 bg-slate-900 px-6 py-3 text-white">
        <h1 className="whitespace-nowrap text-xl font-bold">JWC Kalkulator</h1>
        <div className="flex items-center gap-2">
          <label htmlFor="tool-select" className="text-sm font-medium">
            Narzędzia
          </label>
          <select
            id="tool-select"
            value={activeId}
            onChange={(e) => setActiveId(e.target.value)}
            className="rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-sm text-white focus:border-indigo-400 focus:outline-none"
          >
            {modules.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      </header>

      <Provider>
        <div className="pane-grid text-slate-900">
          <div className="pane-left bg-white p-6">{LeftPane && <LeftPane />}</div>
          <div className="pane-center bg-[lightgreen] p-6">{CenterPane && <CenterPane />}</div>
          <div className="pane-right bg-[azure] p-6">{RightPane && <RightPane />}</div>
        </div>
      </Provider>
    </div>
  )
}

export default App
