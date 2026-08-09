import { Fragment, useState } from 'react'
import { modules } from './modules'
import jwcLogo from './modules/assets/jwc logo 1.png'

function App() {
  const [activeId, setActiveId] = useState(modules[0].id)
  const activeModule = modules.find((m) => m.id === activeId) ?? modules[0]
  const LeftPane = activeModule.panes.left
  const CenterPane = activeModule.panes.center
  const RightPane = activeModule.panes.right
  const Provider = activeModule.provider ?? Fragment

  return (
    <div className="flex h-screen flex-col">
      <header className="relative z-10 flex items-center gap-4 bg-slate-900 px-6 py-3 text-white shadow-lg">
        <img src={jwcLogo} alt="JWC" className="h-9 w-auto shrink-0" />
        <h1 className="whitespace-nowrap text-xl font-bold">JWC Kalkulator</h1>
        <div className="flex items-center gap-2 ml-6">
          <select
            id="tool-select"
            value={activeId}
            onChange={(e) => setActiveId(e.target.value)}
            className="rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-base text-white focus:border-indigo-400 focus:outline-none"
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
          <div className="pane-left bg-[#E3E1E1] p-6">{LeftPane && <LeftPane />}</div>
          <div className="pane-center bg-white p-6">{CenterPane && <CenterPane />}</div>
          <div className="pane-right bg-[#25313C] p-6">{RightPane && <RightPane />}</div>
        </div>
      </Provider>

      <footer className="shrink-0 bg-slate-300 px-6 py-2 text-center text-xs text-slate-700">
        Autor narzędzia nie ponosi odpowiedzialności za błędy w metodologii oraz obliczeniach. Na
        użytkowniku spoczywa obowiązek sprawdzenia wyników oraz przyjętej procedury wymiarowania.
      </footer>
    </div>
  )
}

export default App
