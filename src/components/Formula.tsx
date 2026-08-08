import katex from 'katex'
import 'katex/dist/katex.min.css'

interface FormulaProps {
  tex: string
  block?: boolean
}

function Formula({ tex, block = false }: FormulaProps) {
  const html = katex.renderToString(tex, {
    throwOnError: false,
    displayMode: block,
  })
  return <span dangerouslySetInnerHTML={{ __html: html }} />
}

export default Formula
