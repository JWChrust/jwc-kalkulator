import Collapsible from '../../components/Collapsible'
import Formula from '../../components/Formula'
import RebarSelector, { barArea } from '../../components/RebarSelector'
import { useCorbel } from './CorbelContext'
import { formatNumberTex } from './format'
import { getFck, getFyk } from './materials'

const ALPHA_CC = 0.85
const GAMMA_C = 1.4
const GAMMA_S = 1.15

function CorbelResults() {
  const {
    fVSd,
    aF,
    hDim,
    aH,
    bDim,
    concreteClass,
    steelGrade,
    rebar11Count,
    setRebar11Count,
    rebar11Diameter,
    setRebar11Diameter,
    rebar12Count,
    setRebar12Count,
    rebar12Diameter,
    setRebar12Diameter,
  } = useCorbel()

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

  const a1 = (fVSdNum * 1000) / (fcd * ALPHA_CC * bNum)
  const aDist = aFNum + 0.5 * a1
  const a2 = d - Math.sqrt(d * d - 2 * a1 * aDist)
  const z = d - 0.5 * a2

  const aHNum = Number(aH) || 0
  const as1Case1 = ((0.5 * fVSdNum + hSd) * 1000) / fyd
  const as1Case2 = ((fVSdNum * (aDist / z) + hSd * ((aHNum + z) / z)) * 1000) / fyd
  const as1 = aFh <= 0.3 ? as1Case1 : as1Case2

  const asMin = 0.004 * bNum * d
  const asReq = Math.max(as1, asMin)

  // Formatted values reused in both the symbolic and value-substituted equation renderings.
  const fVSdTex = formatNumberTex(fVSdNum)
  const hSdTex = formatNumberTex(hSd)
  const hTex = formatNumberTex(hNum)
  const aHTex = formatNumberTex(aHNum)
  const dTex = formatNumberTex(d)
  const fcdTex = formatNumberTex(fcd)
  const fydTex = formatNumberTex(fyd, 0)
  const gammaCTex = formatNumberTex(GAMMA_C)
  const gammaSTex = formatNumberTex(GAMMA_S, 2)
  const nuTex = formatNumberTex(nu, 3)
  const bTex = formatNumberTex(bNum)
  const a1Tex = formatNumberTex(a1)
  const aDistTex = formatNumberTex(aDist)
  const a2Tex = formatNumberTex(a2)
  const zTex = formatNumberTex(z)
  const aFTex = formatNumberTex(aFNum)
  const asMinTex = formatNumberTex(asMin, 0)
  const as1Tex = formatNumberTex(as1, 0)
  const asReqTex = formatNumberTex(asReq, 0)
  const fVRdTex = formatNumberTex(fVRd)
  const aFhTex = formatNumberTex(aFh, 3)

  const as11Area = Math.round(rebar11Count * barArea(rebar11Diameter))
  const as12Area = Math.round(rebar12Count * barArea(rebar12Diameter))
  const asProvided = as11Area + as12Area
  const asProvidedTex = formatNumberTex(asProvided, 0)
  // Stresses substituted into force/geometry formulas (kN, mm) are expressed in kN/mm² instead
  // of MPa so the substituted arithmetic stays dimensionally consistent without a hidden ×1000.
  const fcdKNTex = formatNumberTex(fcd / 1000, 4)
  const fydKNTex = formatNumberTex(fyd / 1000, 4)

  return (
    <div className="flex flex-col gap-4 text-slate-900">
      <Collapsible label="obliczenia">
        {(showValues) => (
          <>
            <h2 className="text-lg font-semibold">Obliczenia</h2>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <p className="text-[0.825rem] text-slate-600">Siła pozioma rozciągająca</p>
                <Formula
                  tex={
                    showValues
                      ? String.raw`H_{Sd} = \max(10\ \text{kN};\ 0{,}2 \cdot ${fVSdTex}\ \text{kN}) = \mathbf{${hSdTex}}\ [\text{kN}]`
                      : String.raw`H_{Sd} = \max(10\ \text{kN};\ 0{,}2 \cdot F_{V,Sd}) = \mathbf{${hSdTex}}\ [\text{kN}]`
                  }
                />
              </div>

              <div className="flex flex-col gap-1">
                <p className="text-[0.825rem] text-slate-600">Wysokość użyteczna przekroju</p>
                <Formula
                  tex={
                    showValues
                      ? String.raw`d = ${hTex} - ${aHTex} = \mathbf{${dTex}}\ [\text{mm}]`
                      : String.raw`d = h - a_{H} = \mathbf{${dTex}}\ [\text{mm}]`
                  }
                />
              </div>

              <div className="flex flex-col gap-1">
                <p className="text-[0.825rem] text-slate-600">
                  Charakterystyczna wytrzymałość betonu na ściskanie
                </p>
                <div className="flex items-baseline gap-6">
                  <Formula tex={String.raw`f_{ck} = \mathbf{${fck}}\ [\text{MPa}]`} />
                  <Formula
                    tex={
                      showValues
                        ? String.raw`f_{cd} = \frac{${fck}}{${gammaCTex}} = \mathbf{${fcdTex}}\ [\text{MPa}]`
                        : String.raw`f_{cd} = \frac{f_{ck}}{\gamma_c} = \mathbf{${fcdTex}}\ [\text{MPa}]`
                    }
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
                    tex={
                      showValues
                        ? String.raw`f_{yd} = \frac{${fyk}}{${gammaSTex}} = \mathbf{${fydTex}}\ [\text{MPa}]`
                        : String.raw`f_{yd} = \frac{f_{yk}}{\gamma_s} = \mathbf{${fydTex}}\ [\text{MPa}]`
                    }
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <p className="text-[0.825rem] text-slate-600">
                  Wsp. uwzględniający wpływ obc. długotrwałego (do obliczeń wsporników przyjmuje się
                  0,85)
                </p>
                <Formula tex={String.raw`\alpha_{cc} = 0{,}85\ [-]`} />
              </div>

              <div className="flex flex-col gap-1">
                <p className="text-[0.825rem] text-slate-600">
                  Wsp. uwzględniający zredukowaną wytrzymałość betonu zarysowanego w modelu
                  rusztowym
                </p>
                <Formula
                  tex={
                    showValues
                      ? String.raw`\nu = 0{,}6 \cdot \left(1 - \frac{${fck}}{250}\right) = \mathbf{${nuTex}}\ [-]`
                      : String.raw`\nu = 0{,}6 \cdot \left(1 - \frac{f_{ck}}{250}\right) = \mathbf{${nuTex}}\ [-]`
                  }
                />
              </div>

              <div className="flex flex-col gap-1">
                <p className="text-[0.825rem] text-slate-600">Sprawdzenie geometrii</p>
                <Formula
                  tex={
                    showValues
                      ? String.raw`F_{V,Rd} = \begin{cases} 0{,}4 \cdot ${nuTex} \cdot ${fcdKNTex} \cdot 0{,}85 \cdot ${bTex} \cdot ${dTex} & \text{dla } \frac{a_F}{h} \le 0{,}3 \\ 0{,}5 \cdot ${nuTex} \cdot ${fcdKNTex} \cdot 0{,}85 \cdot ${bTex} \cdot ${dTex} & \text{dla } 0{,}3 < \frac{a_F}{h} \le 1{,}0 \end{cases}`
                      : String.raw`F_{V,Rd} = \begin{cases} 0{,}4 \cdot \nu \cdot f_{cd} \cdot \alpha_{cc} \cdot b \cdot d & \text{dla } \frac{a_F}{h} \le 0{,}3 \\ 0{,}5 \cdot \nu \cdot f_{cd} \cdot \alpha_{cc} \cdot b \cdot d & \text{dla } 0{,}3 < \frac{a_F}{h} \le 1{,}0 \end{cases}`
                  }
                />
                {aFh > 1 ? (
                  <p className="text-sm font-semibold text-red-600">
                    ❌ źle dobrana geometria wspornika
                  </p>
                ) : (
                  <Formula
                    tex={String.raw`\frac{a_F}{h} = \mathbf{${aFhTex}} \Rightarrow F_{V,Rd} = \mathbf{${fVRdTex}}\ [\text{kN}]`}
                  />
                )}
              </div>

              {aFh <= 1 && (
                <div className="flex flex-col gap-1">
                  <p className="text-[0.825rem] text-slate-600">Warunek nośności</p>
                  <Formula
                    tex={String.raw`F_{V,Rd} \ge F_{V,Sd} \Rightarrow \mathbf{${fVRdTex}}\ [\text{kN}] \ge \mathbf{${fVSdTex}}\ [\text{kN}]\quad ${
                      fVRd >= fVSdNum
                        ? String.raw`\textcolor{green}{\checkmark}`
                        : String.raw`\textcolor{red}{\times}`
                    }`}
                  />
                </div>
              )}
            </div>

            <hr className="border-slate-400" />

            <h2 className="text-lg font-semibold">Zbrojenie główne</h2>

            <div className="flex flex-col gap-1">
              <p className="text-[0.825rem] text-slate-600">Współczynniki:</p>
              <div className="flex flex-col gap-1">
                <Formula
                  tex={
                    showValues
                      ? String.raw`a_{1} = ${fVSdTex} / (${fcdKNTex} \cdot 0{,}85 \cdot ${bTex}) = \mathbf{${a1Tex}}\ [\text{mm}]`
                      : String.raw`a_{1} = F_{V,Sd} / (f_{cd} \cdot \alpha_{cc} \cdot b) = \mathbf{${a1Tex}}\ [\text{mm}]`
                  }
                />
                <Formula
                  tex={
                    showValues
                      ? String.raw`a = ${aFTex} + 0{,}5 \cdot ${a1Tex} = \mathbf{${aDistTex}}\ [\text{mm}]`
                      : String.raw`a = a_F + 0{,}5 \cdot a_{1} = \mathbf{${aDistTex}}\ [\text{mm}]`
                  }
                />
                <Formula
                  tex={
                    showValues
                      ? String.raw`a_{2} = ${dTex} - \sqrt{${dTex}^2 - 2 \cdot ${a1Tex} \cdot ${aDistTex}} = \mathbf{${a2Tex}}\ [\text{mm}]`
                      : String.raw`a_{2} = d - \sqrt{d^2 - 2 \cdot a_{1} \cdot a} = \mathbf{${a2Tex}}\ [\text{mm}]`
                  }
                />
                <Formula
                  tex={
                    showValues
                      ? String.raw`z = ${dTex} - 0{,}5 \cdot ${a2Tex} = \mathbf{${zTex}}\ [\text{mm}]`
                      : String.raw`z = d - 0{,}5 \cdot a_{2} = \mathbf{${zTex}}\ [\text{mm}]`
                  }
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <p className="text-[0.825rem] text-slate-600">Zbrojenie wymagane</p>
              <Formula
                tex={
                  showValues
                    ? String.raw`A_{s1} = \begin{cases} (0{,}5 \cdot ${fVSdTex} + ${hSdTex}) / ${fydKNTex} & \text{dla } a_F/h \le 0{,}3 \\[6pt] (${fVSdTex} \cdot ${aDistTex}/${zTex} + ${hSdTex} \cdot (${aHTex} + ${zTex})/${zTex}) / ${fydKNTex} & \text{dla } 0{,}3 < a_F/h \le 1{,}0 \end{cases}`
                    : String.raw`A_{s1} = \begin{cases} (0{,}5 \cdot F_{V,Sd} + H_{Sd}) / f_{yd} & \text{dla } a_F/h \le 0{,}3 \\[6pt] (F_{V,Sd} \cdot a/z + H_{Sd} \cdot (a_H + z)/z) / f_{yd} & \text{dla } 0{,}3 < a_F/h \le 1{,}0 \end{cases}`
                }
              />
              {aFh <= 1 && (
                <Formula
                  tex={String.raw`\frac{a_F}{h} = \mathbf{${aFhTex}} \Rightarrow A_{s1} = \mathbf{${as1Tex}}\ [\text{mm}^2]`}
                />
              )}
            </div>

            <div className="flex flex-col gap-1">
              <p className="text-[0.825rem] text-slate-600">Zbrojenie minimalne</p>
              <Formula
                tex={
                  showValues
                    ? String.raw`A_{s,min} = 0{,}004 \cdot ${bTex} \cdot ${dTex} = \mathbf{${asMinTex}}\ [\text{mm}^2]`
                    : String.raw`A_{s,min} = 0{,}004 \cdot b \cdot d = \mathbf{${asMinTex}}\ [\text{mm}^2]`
                }
              />
            </div>

            <Formula
              tex={
                showValues
                  ? String.raw`A_{s,req} = \max(${as1Tex};\ ${asMinTex}) = \mathbf{${asReqTex}}\ [\text{mm}^2]`
                  : String.raw`A_{s,req} = \max(A_{s1};\ A_{s,min}) = \mathbf{${asReqTex}}\ [\text{mm}^2]`
              }
            />
          </>
        )}
      </Collapsible>

      <div className="flex flex-col gap-1">
        <p className="text-[0.825rem] text-slate-600">Zbrojenie przyjęte</p>
        <RebarSelector
          label="pręty pionowe"
          resultVariable="A_{s11}"
          dotColorClass="bg-[purple]"
          value={{ count: rebar11Count, diameter: rebar11Diameter }}
          onChange={({ count, diameter }) => {
            setRebar11Count(count)
            setRebar11Diameter(diameter)
          }}
        />
        <RebarSelector
          label="pętle poziome"
          resultVariable="A_{s12}"
          dotColorClass="bg-[darkorange]"
          value={{ count: rebar12Count, diameter: rebar12Diameter }}
          onChange={({ count, diameter }) => {
            setRebar12Count(count)
            setRebar12Diameter(diameter)
          }}
        />
      </div>

      <div className="flex flex-col gap-1">
        <Formula
          tex={String.raw`A_{s11} + A_{s12} \ge A_{s,req} \Rightarrow \mathbf{${asProvidedTex}}\ [\text{mm}^2] \ge \mathbf{${asReqTex}}\ [\text{mm}^2]\quad ${
            asProvided >= asReq
              ? String.raw`\textcolor{green}{\checkmark}`
              : String.raw`\textcolor{red}{\times}`
          }`}
        />
      </div>
    </div>
  )
}

export default CorbelResults
