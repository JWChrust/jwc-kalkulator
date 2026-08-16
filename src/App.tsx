import { Fragment, useState } from 'react'
import { modules } from './modules'
import PrintModeContext from './PrintModeContext'
import jwcLogo from './modules/assets/jwc logo 1.png'

const ICON_PROPS = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

function SaveIcon() {
  return (
    <svg {...ICON_PROPS} className="h-4 w-4 shrink-0">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  )
}

function LoadIcon() {
  return (
    <svg {...ICON_PROPS} className="h-4 w-4 shrink-0">
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
    </svg>
  )
}

function PrintIcon() {
  return (
    <svg {...ICON_PROPS} className="h-4 w-4 shrink-0">
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  )
}

function App() {
  const [activeId, setActiveId] = useState(modules[0].id)
  const [presetFileName, setPresetFileName] = useState('')
  const [printMode, setPrintMode] = useState(false)
  const activeModule = modules.find((m) => m.id === activeId) ?? modules[0]
  const LeftPane = activeModule.panes.left
  const CenterPane = activeModule.panes.center
  const RightPane = activeModule.panes.right
  const Provider = activeModule.provider ?? Fragment

  const handleTogglePrintMode = () => {
    const next = !printMode
    setPrintMode(next)
    if (next) {
      // Let the print layout and the 3D view's default-angle reset settle before printing.
      setTimeout(() => window.print(), 250)
    }
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="relative z-10 flex items-center justify-between gap-4 bg-slate-900 px-6 py-3 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleTogglePrintMode}
            aria-pressed={printMode}
            className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-sm font-medium focus:outline-none ${
              printMode
                ? 'border-indigo-400 bg-indigo-600 text-white hover:border-indigo-300'
                : 'border-slate-600 bg-slate-800 text-white hover:border-indigo-400 focus:border-indigo-400'
            }`}
          >
            <PrintIcon />
            {printMode ? 'Zamknij tryb drukowania' : 'Tryb drukowania'}
          </button>

          {!printMode && (
            <>
              <input
                type="text"
                value={presetFileName}
                onChange={(e) => setPresetFileName(e.target.value)}
                placeholder="Brak wczytanego pliku"
                className="w-72 rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-sm text-white placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none"
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="flex items-center gap-1.5 rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-sm font-medium text-white hover:border-indigo-400 focus:border-indigo-400 focus:outline-none"
                >
                  <SaveIcon />
                  Zapisz
                </button>
                <button
                  type="button"
                  className="flex items-center gap-1.5 rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-sm font-medium text-white hover:border-indigo-400 focus:border-indigo-400 focus:outline-none"
                >
                  <LoadIcon />
                  Wczytaj
                </button>
              </div>

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
            </>
          )}
        </div>

        {!printMode && (
          <div className="flex items-center gap-4">
            <h1 className="whitespace-nowrap text-xl font-bold">JWC Kalkulator</h1>
            <img src={jwcLogo} alt="JWC" className="h-9 w-auto shrink-0" />
          </div>
        )}
      </header>

      <Provider>
        <PrintModeContext.Provider value={printMode}>
          <div className={`pane-grid text-slate-900 ${printMode ? 'print-mode' : ''}`}>
            <div className="pane-left bg-[#E3E1E1] p-6">{LeftPane && <LeftPane />}</div>
            <div className="pane-center bg-white p-6">{CenterPane && <CenterPane />}</div>
            <div className="pane-right bg-[#25313C] p-6">{RightPane && <RightPane />}</div>
          </div>
        </PrintModeContext.Provider>
      </Provider>

      <footer className="shrink-0 border-t border-black bg-slate-300 px-6 py-2 text-center text-xs text-black">
        Autor narzędzia nie ponosi odpowiedzialności za błędy w metodologii oraz obliczeniach. Na
        użytkowniku spoczywa obowiązek sprawdzenia wyników oraz przyjętej procedury wymiarowania.
      </footer>
    </div>
  )
}

export default App
