import { Fragment, useEffect, useRef, useState } from 'react'
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
  const [printMode, setPrintMode] = useState(false)
  const printScaleOuterRef = useRef<HTMLDivElement>(null)
  const printScaleInnerRef = useRef<HTMLDivElement>(null)
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

  // Shrink the whole app to fit on a single physical A4 page: measure its natural (unscaled)
  // size, then scale it down (never up) so it fits the page's printable area, and give the
  // wrapper a matching reduced height so the browser doesn't paginate the leftover space onto a
  // second page. The print layout itself (unclamped height, 3D view row sizing) is driven by the
  // printMode React state directly — not by @media print/beforeprint timing, which turned out to
  // be unreliable in real browsers (confirmed in Brave) — so by the time this runs, the DOM is
  // already fully settled and naturalHeight below reflects the true, final layout.
  useEffect(() => {
    const PAGE_MARGIN_MM = 10
    const PAGE_WIDTH_MM = 210
    const PAGE_HEIGHT_MM = 297
    const MM_TO_PX = 96 / 25.4
    const pageWidthPx = (PAGE_WIDTH_MM - 2 * PAGE_MARGIN_MM) * MM_TO_PX
    const pageHeightPx = (PAGE_HEIGHT_MM - 2 * PAGE_MARGIN_MM) * MM_TO_PX

    const handleBeforePrint = () => {
      const outer = printScaleOuterRef.current
      const inner = printScaleInnerRef.current
      if (!outer || !inner) return

      inner.style.transform = 'none'
      inner.style.width = ''
      outer.style.height = ''

      const naturalWidth = inner.scrollWidth
      const naturalHeight = inner.scrollHeight
      const scale = Math.min(1, pageWidthPx / naturalWidth, pageHeightPx / naturalHeight)

      inner.style.transformOrigin = 'top left'
      inner.style.transform = `scale(${scale})`
      inner.style.width = `${100 / scale}%`
      outer.style.height = `${naturalHeight * scale}px`
      outer.style.overflow = 'hidden'
    }

    const handleAfterPrint = () => {
      const outer = printScaleOuterRef.current
      const inner = printScaleInnerRef.current
      if (!outer || !inner) return
      inner.style.transform = ''
      inner.style.width = ''
      outer.style.height = ''
      outer.style.overflow = ''
    }

    window.addEventListener('beforeprint', handleBeforePrint)
    window.addEventListener('afterprint', handleAfterPrint)
    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint)
      window.removeEventListener('afterprint', handleAfterPrint)
    }
  }, [])

  return (
    <div ref={printScaleOuterRef}>
      <div ref={printScaleInnerRef} className={`flex flex-col ${printMode ? '' : 'h-screen'}`}>
        <header className="relative z-10 flex items-center justify-between gap-4 bg-slate-900 px-6 py-3 text-white shadow-lg">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleTogglePrintMode}
              aria-pressed={printMode}
              className={`flex h-9 items-center gap-1.5 rounded-md border px-2 py-1 text-base font-medium focus:outline-none ${
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
                <select
                  id="tool-select"
                  value={activeId}
                  onChange={(e) => setActiveId(e.target.value)}
                  className="h-9 rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-base text-white focus:border-indigo-400 focus:outline-none"
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
              {printMode ? (
                <>
                  <div className="pane-leftcol">
                    <div className="pane-left bg-white p-6">{LeftPane && <LeftPane />}</div>
                    <div className="pane-right bg-white p-6">{RightPane && <RightPane />}</div>
                  </div>
                  <div className="pane-center bg-white p-6">{CenterPane && <CenterPane />}</div>
                </>
              ) : (
                <>
                  <div className="pane-left bg-[#E3E1E1] p-6">{LeftPane && <LeftPane />}</div>
                  <div className="pane-center bg-white p-6">{CenterPane && <CenterPane />}</div>
                  <div className="pane-right bg-[#25313C] p-6">{RightPane && <RightPane />}</div>
                </>
              )}
            </div>
          </PrintModeContext.Provider>
        </Provider>

        <footer
          className={`shrink-0 border-t px-6 py-2 text-center text-xs ${
            printMode ? 'border-black bg-white text-slate-500' : 'border-black bg-slate-300 text-black'
          }`}
        >
          Autor narzędzia nie ponosi odpowiedzialności za błędy w metodologii oraz obliczeniach. Na
          użytkowniku spoczywa obowiązek sprawdzenia wyników oraz przyjętej procedury wymiarowania.
        </footer>
      </div>
    </div>
  )
}

export default App
