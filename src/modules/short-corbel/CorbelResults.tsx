import Collapsible from '../../components/Collapsible'
import Formula from '../../components/Formula'
import StatusIcon from '../../components/StatusIcon'
import UtilizationBadge from '../../components/UtilizationBadge'
import RebarSelector from '../../components/RebarSelector'
import SelektorV3 from '../../components/SelektorV3'
import { computeCorbelResult, GAMMA_C, GAMMA_S } from './calculations'
import { useCorbel } from './CorbelContext'
import { formatNumberTex } from './format'

/** Underlines a piecewise-formula cell (expression or condition) when its case is the one in effect. */
function underline(tex: string, active: boolean): string {
  return active ? `\\underline{${tex}}` : tex
}

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
    rebarSwCount,
    setRebarSwCount,
    rebarSwDiameter,
    setRebarSwDiameter,
    rebar31Count,
    setRebar31Count,
    rebar31Diameter,
    setRebar31Diameter,
  } = useCorbel()

  const fVSdNum = Number(fVSd) || 0
  const aFNum = Number(aF) || 0
  const aHNum = Number(aH) || 0
  const hNum = Number(hDim) || 0
  const bNum = Number(bDim) || 0

  const calc = computeCorbelResult({
    fVSd: fVSdNum,
    aF: aFNum,
    aH: aHNum,
    hDim: hNum,
    bDim: bNum,
    concreteClass,
    steelGrade,
    rebar11Count,
    rebar11Diameter,
    rebar12Count,
    rebar12Diameter,
    rebarSwCount,
    rebarSwDiameter,
    rebar31Count,
    rebar31Diameter,
  })
  const {
    hSd,
    d,
    fck,
    fyk,
    nu,
    fcd,
    fyd,
    aFh,
    fVRd,
    a1,
    aDist,
    a2,
    z,
    as1,
    asMin,
    asReq,
    as11Area,
    as12RequiredArea,
    as12Area,
    asProvided,
    aswH,
    aswHArea,
    beta,
    kFactor,
    rhoL,
    vRdc,
    linkCase1,
    linkCase2,
    linkCase3,
    asLink,
    asLinkArea,
  } = calc

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
  const a1Tex = formatNumberTex(a1, 0)
  const aDistTex = formatNumberTex(aDist, 0)
  const a2Tex = formatNumberTex(a2, 0)
  const zTex = formatNumberTex(z, 0)
  const aFTex = formatNumberTex(aFNum)
  const asMinTex = formatNumberTex(asMin, 0)
  const as1Tex = formatNumberTex(as1, 0)
  const asReqTex = formatNumberTex(asReq, 0)
  const fVRdTex = formatNumberTex(fVRd)
  const aFhTex = formatNumberTex(aFh, 3)

  const as11AreaTex = formatNumberTex(as11Area, 0)
  const as12AreaTex = formatNumberTex(as12Area, 0)
  const asProvidedTex = formatNumberTex(asProvided, 0)
  const aswHTex = formatNumberTex(aswH, 0)
  const aswHAreaTex = formatNumberTex(aswHArea, 0)
  // Maximum stirrup spacing: 0,25h, rounded down to the nearest 10mm.
  const maxStirrupSpacingMm = Math.floor((0.25 * hNum) / 10) * 10
  const maxStirrupSpacingCm = maxStirrupSpacingMm / 10
  // Stresses substituted into force/geometry formulas (kN, mm) are expressed in kN/mm² instead
  // of MPa so the substituted arithmetic stays dimensionally consistent without a hidden ×1000.
  const fcdKNTex = formatNumberTex(fcd / 1000, 4)
  const fydKNTex = formatNumberTex(fyd / 1000, 4)
  const fckKNTex = formatNumberTex(fck / 1000, 4)

  // Which row of each piecewise (cases) formula currently applies, for underlining.
  const case1 = aFh <= 0.3
  const case2 = aFh > 0.3 && aFh <= 1
  const swCase1 = aFh <= 0.3
  const swCase2 = aFh > 0.3 && aFh <= 0.6
  const swCase3 = aFh > 0.6

  // Whether each collapsible's own content currently shows a failing check or invalid geometry.
  const basicWarning = aFh > 1 || fVRd < fVSdNum
  const mainRebarWarning = aFh > 1

  const betaTex = formatNumberTex(beta, 2)
  const kTex = formatNumberTex(kFactor, 2)
  const rhoLTex = formatNumberTex(rhoL, 4)
  const vRdcTex = formatNumberTex(vRdc, 1)
  const asLinkTex = formatNumberTex(asLink, 0)
  const asLinkProvidedTex = formatNumberTex(asLinkArea, 0)

  // Utilization ratios (demand / capacity) shown next to each check.
  const basicUtilization = fVRd > 0 ? (fVSdNum / fVRd) * 100 : 0
  const mainRebarUtilization = asProvided > 0 ? (asReq / asProvided) * 100 : 0
  const swUtilization = aswHArea > 0 ? (aswH / aswHArea) * 100 : 0
  const vRdcUtilization = vRdc > 0 ? (fVSdNum / vRdc) * 100 : 0
  const linkUtilization = asLinkArea > 0 ? (asLink / asLinkArea) * 100 : 0

  return (
    <div className="flex flex-col gap-4 text-slate-900">
      <Collapsible label="obliczenia podstawowe" hasWarning={basicWarning}>
        {(showValues) => (
          <>
            <h2 className="text-[14px] font-semibold">Obliczenia podstawowe</h2>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <p className="text-[14px] text-slate-600">Siła pozioma rozciągająca</p>
                <Formula
                  tex={
                    showValues
                      ? String.raw`H_{Sd} = \max(10\ \text{kN};\ 0{,}2 \cdot ${fVSdTex}\ \text{kN}) = \mathbf{${hSdTex}}\ [\text{kN}]`
                      : String.raw`H_{Sd} = \max(10\ \text{kN};\ 0{,}2 \cdot V_{Ed}) = \mathbf{${hSdTex}}\ [\text{kN}]`
                  }
                />
              </div>

              <div className="flex flex-col gap-1">
                <p className="text-[14px] text-slate-600">Wysokość użyteczna przekroju</p>
                <Formula
                  tex={
                    showValues
                      ? String.raw`d = ${hTex} - ${aHTex} = \mathbf{${dTex}}\ [\text{mm}]`
                      : String.raw`d = h - a_{H} = \mathbf{${dTex}}\ [\text{mm}]`
                  }
                />
              </div>

              <div className="flex flex-col gap-1">
                <p className="text-[14px] text-slate-600">
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
                <p className="text-[14px] text-slate-600">
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
                <p className="text-[14px] text-slate-600">
                  Wsp. uwzględniający wpływ obc. długotrwałego (do obliczeń wsporników przyjmuje się
                  0,85)
                </p>
                <Formula tex={String.raw`\alpha_{cc} = 0{,}85\ [-]`} />
              </div>

              <div className="flex flex-col gap-1">
                <p className="text-[14px] text-slate-600">
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
                <p className="text-[14px] text-slate-600">Sprawdzenie geometrii</p>
                <Formula
                  tex={
                    showValues
                      ? String.raw`F_{V,Rd} = \begin{cases} ${underline(String.raw`0{,}4 \cdot ${nuTex} \cdot ${fcdKNTex} \cdot 0{,}85 \cdot ${bTex} \cdot ${dTex}`, case1)} & ${underline(String.raw`\text{dla } \frac{a_F}{h} \le 0{,}3`, case1)} \\ ${underline(String.raw`0{,}5 \cdot ${nuTex} \cdot ${fcdKNTex} \cdot 0{,}85 \cdot ${bTex} \cdot ${dTex}`, case2)} & ${underline(String.raw`\text{dla } 0{,}3 < \frac{a_F}{h} \le 1{,}0`, case2)} \end{cases}`
                      : String.raw`F_{V,Rd} = \begin{cases} ${underline(String.raw`0{,}4 \cdot \nu \cdot f_{cd} \cdot \alpha_{cc} \cdot b \cdot d`, case1)} & ${underline(String.raw`\text{dla } \frac{a_F}{h} \le 0{,}3`, case1)} \\ ${underline(String.raw`0{,}5 \cdot \nu \cdot f_{cd} \cdot \alpha_{cc} \cdot b \cdot d`, case2)} & ${underline(String.raw`\text{dla } 0{,}3 < \frac{a_F}{h} \le 1{,}0`, case2)} \end{cases}`
                  }
                />
                {aFh > 1 ? (
                  <p className="text-[14px] font-semibold text-red-600">
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
                  <p className="text-[14px] text-slate-600">Warunek nośności</p>
                  <div className="flex items-center gap-2">
                    <Formula
                      tex={String.raw`F_{V,Rd} \ge V_{Ed} \Rightarrow \mathbf{${fVRdTex}}\ [\text{kN}] \ge \mathbf{${fVSdTex}}\ [\text{kN}]`}
                    />
                    <StatusIcon ok={fVRd >= fVSdNum} />
                    <UtilizationBadge percent={basicUtilization} />
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </Collapsible>

      <Collapsible label="obliczenia zbrojenia głównego" hasWarning={mainRebarWarning}>
        {(showValues) => (
          <>
            <h2 className="text-[14px] font-semibold">Zbrojenie główne</h2>

            <div className="flex flex-col gap-1">
              <p className="text-[14px] text-slate-600">Wielkości geometryczne</p>
              <div className="flex flex-col gap-1">
                <Formula
                  tex={
                    showValues
                      ? String.raw`a_{1} = ${fVSdTex} / (${fcdKNTex} \cdot 0{,}85 \cdot ${bTex}) = \mathbf{${a1Tex}}\ [\text{mm}]`
                      : String.raw`a_{1} = V_{Ed} / (f_{cd} \cdot \alpha_{cc} \cdot b) = \mathbf{${a1Tex}}\ [\text{mm}]`
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
              <p className="text-[14px] text-slate-600">Zbrojenie wymagane</p>
              <Formula
                tex={
                  showValues
                    ? String.raw`A_{s1} = \begin{cases} ${underline(String.raw`(0{,}5 \cdot ${fVSdTex} + ${hSdTex}) / ${fydKNTex}`, case1)} & ${underline(String.raw`\text{dla } a_F/h \le 0{,}3`, case1)} \\[6pt] ${underline(String.raw`(${fVSdTex} \cdot ${aDistTex}/${zTex} + ${hSdTex} \cdot (${aHTex} + ${zTex})/${zTex}) / ${fydKNTex}`, case2)} & ${underline(String.raw`\text{dla } 0{,}3 < a_F/h \le 1{,}0`, case2)} \end{cases}`
                    : String.raw`A_{s1} = \begin{cases} ${underline(String.raw`(0{,}5 \cdot V_{Ed} + H_{Sd}) / f_{yd}`, case1)} & ${underline(String.raw`\text{dla } a_F/h \le 0{,}3`, case1)} \\[6pt] ${underline(String.raw`(V_{Ed} \cdot a/z + H_{Sd} \cdot (a_H + z)/z) / f_{yd}`, case2)} & ${underline(String.raw`\text{dla } 0{,}3 < a_F/h \le 1{,}0`, case2)} \end{cases}`
                }
              />
              {aFh <= 1 && (
                <Formula
                  tex={String.raw`\frac{a_F}{h} = \mathbf{${aFhTex}} \Rightarrow A_{s1} = \mathbf{${as1Tex}}\ [\text{mm}^2]`}
                />
              )}
            </div>

            <div className="flex flex-col gap-1">
              <p className="text-[14px] text-slate-600">Zbrojenie minimalne</p>
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
        <RebarSelector
          label="pręty główne"
          resultVariable="A_{s11}"
          dotColorClass="bg-[purple]"
          value={{ count: rebar11Count, diameter: rebar11Diameter }}
          onChange={({ count, diameter }) => {
            setRebar11Count(count)
            setRebar11Diameter(diameter)
          }}
          initialPhase={1}
          disabledPhases={[0]}
        />
        <SelektorV3
          label="pętle poziome"
          resultVariable="A_{s12}"
          requiredArea={as12RequiredArea}
          dotColorClass="bg-[darkorange]"
          value={{ count: rebar12Count, diameter: rebar12Diameter }}
          onChange={({ count, diameter }) => {
            setRebar12Count(count)
            setRebar12Diameter(diameter)
          }}
          initialPhase={1}
          disabledPhases={[0]}
        />
      </div>

      <div className="flex items-center gap-2">
        <Formula
          tex={String.raw`A_{s11} + A_{s12} \ge A_{s,req} \Rightarrow \mathbf{${asProvidedTex}}\ [\text{mm}^2] \ge \mathbf{${asReqTex}}\ [\text{mm}^2]`}
        />
        <StatusIcon ok={asProvided >= asReq} />
        <UtilizationBadge percent={mainRebarUtilization} />
      </div>

      <Collapsible label="obliczenia strzemion poziomych">
        {(showValues) => (
          <>
            <p className="text-[14px] text-slate-600">Zbrojenie strzemion poziomych</p>
            <Formula
              tex={
                showValues
                  ? String.raw`A_{sw,h} = \begin{cases} ${underline(String.raw`0{,}5 \cdot ${fVSdTex} / ${fydKNTex}`, swCase1)} & ${underline(String.raw`\text{dla } a_F/h \le 0{,}3`, swCase1)} \\ ${underline(String.raw`0{,}5 \cdot (${as11AreaTex} + ${as12AreaTex})`, swCase2)} & ${underline(String.raw`\text{dla } 0{,}3 < a_F/h \le 0{,}6`, swCase2)} \\ ${underline(String.raw`0{,}3 \cdot (${as11AreaTex} + ${as12AreaTex})`, swCase3)} & ${underline(String.raw`\text{dla } a_F/h > 0{,}6`, swCase3)} \end{cases}`
                  : String.raw`A_{sw,h} = \begin{cases} ${underline(String.raw`0{,}5 \cdot V_{Ed} / f_{ywd}`, swCase1)} & ${underline(String.raw`\text{dla } a_F/h \le 0{,}3`, swCase1)} \\ ${underline(String.raw`0{,}5 \cdot (A_{s11} + A_{s12})`, swCase2)} & ${underline(String.raw`\text{dla } 0{,}3 < a_F/h \le 0{,}6`, swCase2)} \\ ${underline(String.raw`0{,}3 \cdot (A_{s11} + A_{s12})`, swCase3)} & ${underline(String.raw`\text{dla } a_F/h > 0{,}6`, swCase3)} \end{cases}`
              }
            />
            <Formula
              tex={String.raw`\frac{a_F}{h} = \mathbf{${aFhTex}} \Rightarrow A_{sw,h} = \mathbf{${aswHTex}}\ [\text{mm}^2]`}
            />
          </>
        )}
      </Collapsible>

      <div className="flex flex-col gap-1">
        <SelektorV3
          label="strzemiona poziome"
          resultVariable="A_{s21}"
          requiredArea={aswH}
          dotColorClass="bg-[blue]"
          value={{ count: rebarSwCount, diameter: rebarSwDiameter }}
          onChange={({ count, diameter }) => {
            setRebarSwCount(count)
            setRebarSwDiameter(diameter)
          }}
          initialPhase={1}
          disabledPhases={[0]}
        />
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Formula
            tex={String.raw`A_{s21} \ge A_{sw,h} \Rightarrow \mathbf{${aswHAreaTex}}\ [\text{mm}^2] \ge \mathbf{${aswHTex}}\ [\text{mm}^2]`}
          />
          <StatusIcon ok={aswHArea >= aswH} />
          <UtilizationBadge percent={swUtilization} />
        </div>
        <p className="text-[14px] text-slate-600">
          Strzemiona rozmieścić równomiernie na wysokośći wspornika w rozstawach nie większych niż{' '}
          {maxStirrupSpacingCm}cm.
        </p>
      </div>

      <div className="flex flex-col gap-1 mt-4">
        <p className="text-[14px] text-slate-600">
          Sprawdzenie zapotrzebowania na strzemiona pionowe
        </p>
        <Formula
          tex={String.raw`\frac{a_F}{h} = \mathbf{${aFhTex}} ${aFh <= 0.5 ? '\\le' : '>'} 0{,}5 \Rightarrow ${
            aFh <= 0.5
              ? String.raw`\textbf{\text{strzemiona pionowe nie są wymagane}}`
              : String.raw`\textcolor{red}{\textbf{\text{wymagane zbrojenie strzemionami pionowymi}}}`
          }`}
        />
      </div>

      <Collapsible label="sprawdzenia strzemion pionowych">
        {(showValues) => (
          <>
            <div className="flex flex-col gap-1">
              <p className="text-[14px] text-slate-600">Współczynnik skali</p>
              <Formula
                tex={
                  showValues
                    ? String.raw`k = \min\left(1 + \sqrt{200/${dTex}};\ 2{,}0\right) = \mathbf{${kTex}}\ [-]`
                    : String.raw`k = \min\left(1 + \sqrt{200/d};\ 2{,}0\right) = \mathbf{${kTex}}\ [-]`
                }
              />
            </div>

            <div className="flex flex-col gap-1">
              <p className="text-[14px] text-slate-600">Współczynnik β</p>
              <Formula
                tex={
                  showValues
                    ? String.raw`\beta = ${aFTex}/(2 \cdot ${dTex}) = \mathbf{${betaTex}}\ [-]`
                    : String.raw`\beta = a_F/(2d) = \mathbf{${betaTex}}\ [-]`
                }
              />
            </div>

            <div className="flex flex-col gap-1">
              <p className="text-[14px] text-slate-600">
                Stopień zbrojenia zakotwionego w korpusie
              </p>
              <Formula
                tex={
                  showValues
                    ? String.raw`\rho_l = \dfrac{${as11AreaTex} + ${as12AreaTex}}{${bTex} \cdot ${dTex}} = \mathbf{${rhoLTex}}\ [-]`
                    : String.raw`\rho_l = \dfrac{A_{s11} + A_{s12}}{b \cdot d} = \mathbf{${rhoLTex}}\ [-]`
                }
              />
            </div>

            <div className="flex flex-col gap-1">
              <p className="text-[14px] text-slate-600">
                Nośność elementu bez zbrojenia poprzecznego
              </p>
              <Formula
                tex={
                  showValues
                    ? String.raw`V_{Rd,c} = \dfrac{0{,}129 \cdot ${kTex} \cdot \sqrt[3]{100 \cdot ${rhoLTex} \cdot ${fckKNTex}} \cdot ${bTex} \cdot ${dTex}}{100} = \mathbf{${vRdcTex}}\ [\text{kN}]`
                    : String.raw`V_{Rd,c} = \dfrac{0{,}129 \cdot k \cdot \sqrt[3]{100 \cdot \rho_l \cdot f_{ck}} \cdot b \cdot d}{100} = \mathbf{${vRdcTex}}\ [\text{kN}]`
                }
              />
            </div>

            <div className="flex flex-col gap-1">
              <p className="text-[14px] text-slate-600">Warunek nośności betonu na ścinanie</p>
              <div className="flex items-center gap-2">
                <Formula
                  tex={String.raw`V_{Rd,c} \ge F_{Ed} \Rightarrow \mathbf{${vRdcTex}}\ [\text{kN}] \ge \mathbf{${fVSdTex}}\ [\text{kN}]`}
                />
                <StatusIcon ok={vRdc >= fVSdNum} />
                <UtilizationBadge percent={vRdcUtilization} />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <p className="text-[14px] text-slate-600">Wymagane zbrojenie strzemionami pionowymi</p>
              <Formula
                tex={
                  showValues
                    ? String.raw`A_{s,link} = \begin{cases} ${underline('0', linkCase1)} & ${underline(String.raw`\text{dla } a_F/h \le 0{,}5`, linkCase1)} \\[6pt] ${underline(String.raw`0{,}5 \cdot ${fVSdTex} / ${fydKNTex}`, linkCase2)} & ${underline(String.raw`\text{dla } a_F/h > 0{,}5 \text{ oraz } V_{Rd,cr} < V_{Ed}`, linkCase2)} \\[6pt] ${underline(String.raw`\left(2 \cdot ${aDistTex}/${zTex} - 1\right) / (3 \cdot ${fydKNTex}) \cdot ${fVSdTex}`, linkCase3)} & ${underline(String.raw`\text{dla } a_F/h > 0{,}5 \text{ oraz } V_{Rd,cr} \ge V_{Ed}`, linkCase3)} \end{cases}`
                    : String.raw`A_{s,link} = \begin{cases} ${underline('0', linkCase1)} & ${underline(String.raw`\text{dla } a_F/h \le 0{,}5`, linkCase1)} \\[6pt] ${underline(String.raw`0{,}5 \cdot V_{Ed} / f_{yd}`, linkCase2)} & ${underline(String.raw`\text{dla } a_F/h > 0{,}5 \text{ oraz } V_{Rd,cr} < V_{Ed}`, linkCase2)} \\[6pt] ${underline(String.raw`\left(2a/z - 1\right) / (3 \cdot f_{ywd}) \cdot V_{Ed}`, linkCase3)} & ${underline(String.raw`\text{dla } a_F/h > 0{,}5 \text{ oraz } V_{Rd,cr} \ge V_{Ed}`, linkCase3)} \end{cases}`
                }
              />
              <Formula
                tex={String.raw`\frac{a_F}{h} = \mathbf{${aFhTex}} \Rightarrow A_{s,link} = \mathbf{${asLinkTex}}\ [\text{mm}^2]`}
              />
              {linkCase1 && (
                <p className="text-[14px] text-slate-900">
                  Strzemiona pionowe nie wymagane
                </p>
              )}
            </div>
          </>
        )}
      </Collapsible>

      <div className="flex flex-col gap-1">
        <SelektorV3
          label="strzemiona pionowe"
          resultVariable="A_{s31}"
          requiredArea={asLink}
          dotColorClass="bg-[green]"
          value={{ count: rebar31Count, diameter: rebar31Diameter }}
          onChange={({ count, diameter }) => {
            setRebar31Count(count)
            setRebar31Diameter(diameter)
          }}
          initialPhase={1}
          disabledPhases={[0]}
        />
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Formula
            tex={String.raw`A_{s31} \ge A_{s,link} \Rightarrow \mathbf{${asLinkProvidedTex}}\ [\text{mm}^2] \ge \mathbf{${asLinkTex}}\ [\text{mm}^2]`}
          />
          <StatusIcon ok={asLinkArea >= asLink} />
          <UtilizationBadge percent={linkUtilization} />
        </div>
        <p className="text-[14px] text-slate-600">
          Strzemiona rozmieścić równomiernie na odcinku od lica słupa do krawędzi płytki
          podporowej w rozstawach nie większych niż {maxStirrupSpacingCm}cm.
        </p>
        <p className="mt-4 text-[14px] text-slate-600">
          Przedstawione zbrojenie to minimalne zbrojenie wynikające z konieczności przeniesienia
          sił przez wspornik na korpus słupa. Szkic przedstawia tylko jedną z możliwych konfiguracji.
          Pręty należy uzupełnić o strzemiona wymagane konstrukcyjnie (np. z konieczności
          ograniczenia zarysowania) oraz z uwagi na względy montażowe.
        </p>
        <p className="text-[14px] text-slate-600">
          W przypadku zastosowania zbrojenia głównego w postaci pętli pionowych strzemiona poziome
          wspornika należy umieszczać możliwie blisko górnej powierzchni wspornika z uwagi na
          niebezpieczeństwo odspojenia betonu w narożu za podkładką. Rozwiązaniem bardziej
          korzystnym jest pod tym względem zastosowanie petli poziomych (pręty 3D).
        </p>
      </div>
    </div>
  )
}

export default CorbelResults
