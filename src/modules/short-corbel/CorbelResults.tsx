import Formula from '../../components/Formula'
import { useCorbel } from './CorbelContext'
import { formatNumberTex } from './format'
import { getFck, getFyk } from './materials'

const ALPHA_CC = 0.85
const GAMMA_C = 1.4
const GAMMA_S = 1.15

function CorbelResults() {
  const { fVSd, aF, hDim, aH, bDim, concreteClass, steelGrade } = useCorbel()
  const fVSdNum = Number(fVSd) || 0
  const hSd = Math.max(10, 0.2 * fVSdNum)
  const d = (Number(hDim) || 0) - (Number(aH) || 0)
  const fck = getFck(concreteClass)
  const fyk = getFyk(steelGrade)
  const nu = 0.6 * (1 - fck / 250)
  const fcd = fck / GAMMA_C
  const fyd = fyk / GAMMA_S

  const aFNum = Number(aF) || 0
  const hNum = Number(hDim) || 0
  const bNum = Number(bDim) || 0
  const aFh = hNum !== 0 ? aFNum / hNum : 0
  const coefficient = aFh <= 0.3 ? 0.4 : 0.5
  const fVRd = (coefficient * nu * fcd * ALPHA_CC * bNum * d) / 1000

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-4 text-slate-900">
      <h2 className="text-lg font-semibold">Obliczenia</h2>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-[0.825rem] text-slate-600">Siła pozioma rozciągająca</p>
          <Formula
            tex={String.raw`H_{Sd} = \max(10\ \text{kN};\ 0{,}2 \cdot F_{V,Sd}) = \mathbf{${formatNumberTex(hSd)}}\ [\text{kN}]`}
          />
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-[0.825rem] text-slate-600">Wysokość użyteczna przekroju</p>
          <Formula tex={String.raw`d = h - a_{H} = \mathbf{${formatNumberTex(d)}}\ [\text{mm}]`} />
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-[0.825rem] text-slate-600">
            Charakterystyczna wytrzymałość betonu na ściskanie
          </p>
          <div className="flex items-baseline gap-6">
            <Formula tex={String.raw`f_{ck} = \mathbf{${fck}}\ [\text{MPa}]`} />
            <Formula
              tex={String.raw`f_{cd} = \frac{f_{ck}}{\gamma_c} = \mathbf{${formatNumberTex(fcd)}}\ [\text{MPa}]`}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-[0.825rem] text-slate-600">
            Charakterystyczna granica plastyczności stali zbrojeniowej
          </p>
          <div className="flex items-baseline gap-6">
            <Formula tex={String.raw`f_{yk} = \mathbf{${fyk}}\ [\text{MPa}]`} />
            <Formula
              tex={String.raw`f_{yd} = \frac{f_{yk}}{\gamma_s} = \mathbf{${formatNumberTex(fyd, 0)}}\ [\text{MPa}]`}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-[0.825rem] text-slate-600">
            Wsp. uwzględniający wpływ obc. długotrwałego (do obliczeń wsporników przyjmuje się 0,85)
          </p>
          <Formula tex={String.raw`\alpha_{cc} = 0{,}85\ [-]`} />
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-[0.825rem] text-slate-600">
            Wsp. uwzględniający zredukowaną wytrzymałość betonu zarysowanego w modelu rusztowym
          </p>
          <Formula
            tex={String.raw`\nu = 0{,}6 \cdot \left(1 - \frac{f_{ck}}{250}\right) = \mathbf{${formatNumberTex(nu, 3)}}\ [-]`}
          />
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-[0.825rem] text-slate-600">Sprawdzenie geometrii</p>
          <Formula
            tex={String.raw`F_{V,Rd} = \begin{cases} 0{,}4 \cdot \nu \cdot f_{cd} \cdot \alpha_{cc} \cdot b \cdot d & \text{jeżeli } \frac{a_F}{h} \le 0{,}3 \\ 0{,}5 \cdot \nu \cdot f_{cd} \cdot \alpha_{cc} \cdot b \cdot d & \text{jeżeli } 0{,}3 < \frac{a_F}{h} \le 1{,}0 \end{cases}`}
          />
          {aFh > 1 ? (
            <p className="text-sm font-semibold text-red-600">❌ źle dobrana geometria wspornika</p>
          ) : (
            <Formula
              tex={String.raw`\frac{a_F}{h} = \mathbf{${formatNumberTex(aFh, 3)}} \Rightarrow F_{V,Rd} = \mathbf{${formatNumberTex(fVRd)}}\ [\text{kN}]`}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default CorbelResults
