import Collapsible from '../../components/Collapsible'
import Formula from '../../components/Formula'
import StatusIcon from '../../components/StatusIcon'
import UtilizationBadge from '../../components/UtilizationBadge'
import RebarSelector, { barArea } from '../../components/RebarSelector'
import RebarSelectorAuto from '../../components/RebarSelectorAuto'
import { useBeamDappedEnd } from './BeamDappedEndContext'
import { formatNumberTex } from '../short-corbel/format'
import { ALPHA_CC, GAMMA_C, GAMMA_S } from '../short-corbel/calculations'
import { getFck, getFyk } from '../short-corbel/materials'

/** Underlines a piecewise-formula cell (expression or condition) when its case is the one in effect. */
function underline(tex: string, active: boolean): string {
  return active ? `\\underline{${tex}}` : tex
}

function BeamDappedEndResults() {
  const {
    hDim,
    hK,
    lK,
    aK,
    aV,
    bDim,
    vEd,
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
    rebar13Count,
    setRebar13Count,
    rebar13Diameter,
    setRebar13Diameter,
    rebar21Diameter,
    setRebar21Diameter,
    rebar31Count,
    setRebar31Count,
    rebar31Diameter,
    setRebar31Diameter,
    rebar32Count,
    setRebar32Count,
    rebar32Diameter,
    setRebar32Diameter,
    rebar33Diameter,
    setRebar33Diameter,
  } = useBeamDappedEnd()

  const hNum = Number(hDim) || 0
  const hKNum = Number(hK) || 0
  const lKNum = Number(lK) || 0
  const aKNum = Number(aK) || 0
  const aVNum = Number(aV) || 0
  const bNum = Number(bDim) || 0
  const vEdNum = Number(vEd) || 0

  const lowerBound = 0.3 * hNum
  const upperBound = 0.7 * hNum
  const conditionMet = lKNum <= hKNum && hKNum >= lowerBound && hKNum <= upperBound

  const lowerBoundTex = formatNumberTex(lowerBound, 0)
  const upperBoundTex = formatNumberTex(upperBound, 0)
  const hKTex = formatNumberTex(hKNum, 0)
  const lKTex = formatNumberTex(lKNum, 0)
  const aKTex = formatNumberTex(aKNum, 0)
  const bTex = formatNumberTex(bNum, 0)
  const vEdTex = formatNumberTex(vEdNum, 0)

  const fck = getFck(concreteClass)
  const fcd = (ALPHA_CC * fck) / GAMMA_C
  // Stress substituted in kN/mm² instead of MPa so the substituted arithmetic (kN, mm) stays
  // dimensionally consistent without a hidden ×1000.
  const fcdKNTex = formatNumberTex(fcd / 1000, 4)
  const fckTex = formatNumberTex(fck, 0)
  const fcdTex = formatNumberTex(fcd, 2)
  const alphaCcTex = formatNumberTex(ALPHA_CC, 2)
  const gammaCTex = formatNumberTex(GAMMA_C, 2)

  const dK = hKNum - aKNum
  const fVRd = 0.28 * fcd * bNum * dK
  const fVRdKN = fVRd / 1000

  const dKTex = formatNumberTex(dK, 0)
  const fVRdTex = formatNumberTex(fVRdKN, 0)

  const capacityMet = vEdNum < fVRdKN

  const hSd = 0.2 * vEdNum
  const zK = 0.8 * dK
  const theta1 = Math.atan(zK / (aVNum + aKNum))
  const theta1Deg = (theta1 * 180) / Math.PI
  const cotTheta1 = 1 / Math.tan(theta1)

  const fyk = getFyk(steelGrade)
  const fyd = fyk / GAMMA_S
  const fydKNTex = formatNumberTex(fyd / 1000, 4)

  const asp1 = ((vEdNum * (aKNum / zK) + 0.5 * vEdNum * cotTheta1 + hSd) * 1000) / fyd
  const asp2 = ((0.5 * vEdNum + hSd) * 1000) / fyd
  const asp = Math.max(asp1, asp2)

  const hSdTex = formatNumberTex(hSd, 0)
  const zKTex = formatNumberTex(zK, 0)
  const aVTex = formatNumberTex(aVNum, 0)
  const theta1Tex = formatNumberTex(theta1Deg, 1)
  const asp1Tex = formatNumberTex(asp1, 0)
  const asp2Tex = formatNumberTex(asp2, 0)
  const aspTex = formatNumberTex(asp, 0)

  // A_s11/A_s12/A_s13 — the three manually-picked bar groups meant to cover A_sp together.
  const as11Area = Math.round(rebar11Count * barArea(rebar11Diameter))
  const as12Area = Math.round(rebar12Count * barArea(rebar12Diameter))
  const as13Area = Math.round(rebar13Count * barArea(rebar13Diameter))
  const asProvidedTotal = as11Area + as12Area + as13Area
  const totalCheckMet = asProvidedTotal > asp

  const asProvidedTotalTex = formatNumberTex(asProvidedTotal, 0)

  const aswp = (1.3 * vEdNum + 0.3 * hSd) / (fyd / 1000)
  const aswpTex = formatNumberTex(aswp, 0)

  const as31Area = Math.round(rebar31Count * barArea(rebar31Diameter))
  const as32Area = Math.round(rebar32Count * barArea(rebar32Diameter))

  // A_s33 — the v2 (diameter-only) picker's provided area, sized to cover the remainder of A_swp
  // not already covered by A_s31 + A_s32; mirrors RebarSelectorAuto's own internal leg-count logic.
  const aswp33Required = Math.max(aswp - as31Area - as32Area, 0)
  const rebar33SingleArea = barArea(rebar33Diameter)
  const rebar33RawCount = rebar33SingleArea > 0 ? Math.ceil(aswp33Required / rebar33SingleArea) : 0
  const rebar33Legs = 2 * Math.ceil(rebar33RawCount / 2)
  const as33Area = Math.round(rebar33Legs * rebar33SingleArea)

  const asProvidedTotal2 = as31Area + as32Area + as33Area
  const totalCheckMet2 = asProvidedTotal2 > aswp

  const asProvidedTotal2Tex = formatNumberTex(asProvidedTotal2, 0)

  // A_s,link — supplementary reinforcement: horizontal loops carry it when a_v/h_k is small
  // (piggybacking on the already-selected A_s1n total), otherwise dedicated vertical stirrups do.
  const avHk = hKNum > 0 ? aVNum / hKNum : 0
  const linkCase1 = avHk <= 0.5
  const linkCase2 = avHk > 0.5
  const asLink1 = 0.5 * asProvidedTotal
  const asLink2 = (0.5 * vEdNum) / (fyd / 1000)
  const asLink = linkCase1 ? asLink1 : asLink2
  const avHkTex = formatNumberTex(avHk, 3)
  const asLinkTex = formatNumberTex(asLink, 0)

  // A_s31 (zbrojenie uzupełniające) — the v2 (diameter-only) picker's provided area; mirrors
  // RebarSelectorAuto's own internal leg-count logic.
  const rebarLinkSingleArea = barArea(rebar21Diameter)
  const rebarLinkRawCount = rebarLinkSingleArea > 0 ? Math.ceil(asLink / rebarLinkSingleArea) : 0
  const rebarLinkLegs = 2 * Math.ceil(rebarLinkRawCount / 2)
  const asLinkProvided = Math.round(rebarLinkLegs * rebarLinkSingleArea)
  const asLinkProvidedTex = formatNumberTex(asLinkProvided, 0)
  const linkCheckMet = asLinkProvided >= asLink

  // Utilization ratios (demand / capacity) shown next to each check.
  const capacityUtilization = fVRdKN > 0 ? (vEdNum / fVRdKN) * 100 : 0
  const spUtilization = asProvidedTotal > 0 ? (asp / asProvidedTotal) * 100 : 0
  const swpUtilization = asProvidedTotal2 > 0 ? (aswp / asProvidedTotal2) * 100 : 0
  const linkUtilization = asLinkProvided > 0 ? (asLink / asLinkProvided) * 100 : 0

  return (
    <div className="flex flex-col gap-4 text-slate-900">
      <div className="flex flex-col gap-1">
        <p className="text-[14px] text-slate-600">
          Zakres stosowalności zasad dla krótkich wsporników
        </p>
        <div className="flex items-center gap-2">
          <Formula
            tex={String.raw`l_k \le h_k \ \text{oraz}\ 0{,}3h \le h_k \le 0{,}7h`}
          />
          <StatusIcon ok={conditionMet} />
        </div>
        <Formula
          tex={String.raw`${lKTex} \le ${hKTex} \ \text{oraz}\ ${lowerBoundTex} \le ${hKTex} \le ${upperBoundTex}`}
        />
        {!conditionMet && (
          <p className="text-[14px] font-semibold text-red-600">
            Nie można stosować zasad dla krótkich wsporników belek
          </p>
        )}
      </div>

      <Collapsible label="obliczenia">
        {(showValues) => (
          <div className="flex flex-col gap-1">
            <div className="flex flex-col gap-1">
              <p className="text-[14px] text-slate-600">Wysokość użyteczna podcięcia</p>
              <Formula
                tex={
                  showValues
                    ? String.raw`d_k = ${hKTex} - ${aKTex} = \mathbf{${dKTex}}\ [\text{mm}]`
                    : String.raw`d_k = h_k - a_k = \mathbf{${dKTex}}\ [\text{mm}]`
                }
              />
            </div>

            <div className="flex flex-col gap-1">
              <p className="text-[14px] text-slate-600">Obliczeniowa wytrzymałość betonu</p>
              <Formula
                tex={
                  showValues
                    ? String.raw`f_{cd} = \dfrac{${alphaCcTex} \cdot ${fckTex}}{${gammaCTex}} = \mathbf{${fcdTex}}\ [\text{MPa}]`
                    : String.raw`f_{cd} = \dfrac{\alpha_{cc} \cdot f_{ck}}{\gamma_c} = \mathbf{${fcdTex}}\ [\text{MPa}]`
                }
              />
            </div>

            <div className="flex flex-col gap-1">
              <p className="text-[14px] text-slate-600">Nośność podcięcia na ścinanie</p>
              <Formula
                tex={
                  showValues
                    ? String.raw`F_{V,Rd} = 0{,}28 \cdot ${fcdKNTex} \cdot ${bTex} \cdot ${dKTex} = \mathbf{${fVRdTex}}\ [\text{kN}]`
                    : String.raw`F_{V,Rd} = 0{,}28 \cdot f_{cd} \cdot b \cdot d_k = \mathbf{${fVRdTex}}\ [\text{kN}]`
                }
              />
            </div>

            <div className="flex flex-col gap-1">
              <p className="text-[14px] text-slate-600">Warunek nośności</p>
              <div className="flex items-center gap-2">
                <Formula
                  tex={String.raw`V_{Ed} < F_{V,Rd} \Rightarrow \mathbf{${vEdTex}}\ [\text{kN}] < \mathbf{${fVRdTex}}\ [\text{kN}]`}
                />
                <StatusIcon ok={capacityMet} />
                <UtilizationBadge percent={capacityUtilization} />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <p className="text-[14px] text-slate-600">Siła pozioma rozciągająca</p>
              <Formula
                tex={
                  showValues
                    ? String.raw`H_{Sd} = 0{,}2 \cdot ${vEdTex} = \mathbf{${hSdTex}}\ [\text{kN}]`
                    : String.raw`H_{Sd} = 0{,}2 \cdot V_{Ed} = \mathbf{${hSdTex}}\ [\text{kN}]`
                }
              />
            </div>

            <div className="flex flex-col gap-1">
              <p className="text-[14px] text-slate-600">Ramię sił wewnętrznych</p>
              <Formula
                tex={
                  showValues
                    ? String.raw`z_k = 0{,}8 \cdot ${dKTex} = \mathbf{${zKTex}}\ [\text{mm}]`
                    : String.raw`z_k = 0{,}8 \cdot d_k = \mathbf{${zKTex}}\ [\text{mm}]`
                }
              />
            </div>

            <div className="flex flex-col gap-1">
              <p className="text-[14px] text-slate-600">Kąt nachylenia krzyżulca</p>
              <Formula
                tex={
                  showValues
                    ? String.raw`\Theta_1 = \arctan\left(${zKTex}/(${aVTex} + ${aKTex})\right) = \mathbf{${theta1Tex}}°`
                    : String.raw`\Theta_1 = \arctan\left(z_k/(a_v + a_k)\right) = \mathbf{${theta1Tex}}°`
                }
              />
            </div>

            <div className="mt-4 flex flex-col gap-1">
              <p className="text-[14px] font-semibold text-slate-600">Wymagane zbrojenie poziome</p>
              <Formula
                tex={
                  showValues
                    ? String.raw`A_{sp1} = \dfrac{1}{${fydKNTex}} \cdot \left(${vEdTex} \cdot (${aKTex}/${zKTex}) + 0{,}5 \cdot ${vEdTex} \cdot \cot(${theta1Tex}°) + ${hSdTex}\right) = \mathbf{${asp1Tex}}\ [\text{mm}^2]`
                    : String.raw`A_{sp1} = \dfrac{1}{f_{yd}} \cdot \left(V_{Ed} \cdot (a_k/z_k) + 0{,}5 \cdot V_{Ed} \cdot \cot(\Theta_1) + H_{Sd}\right) = \mathbf{${asp1Tex}}\ [\text{mm}^2]`
                }
              />
              <Formula
                tex={
                  showValues
                    ? String.raw`A_{sp2} = \dfrac{1}{${fydKNTex}} \cdot \left(0{,}5 \cdot ${vEdTex} + ${hSdTex}\right) = \mathbf{${asp2Tex}}\ [\text{mm}^2]`
                    : String.raw`A_{sp2} = \dfrac{1}{f_{yd}} \cdot \left(0{,}5 \cdot V_{Ed} + H_{Sd}\right) = \mathbf{${asp2Tex}}\ [\text{mm}^2]`
                }
              />
              <Formula
                tex={
                  showValues
                    ? String.raw`A_{sp} = \max(${asp1Tex};\ ${asp2Tex}) = \mathbf{${aspTex}}\ [\text{mm}^2]`
                    : String.raw`A_{sp} = \max(A_{sp1};\ A_{sp2}) = \mathbf{${aspTex}}\ [\text{mm}^2]`
                }
              />
            </div>

            <div className="mt-4 flex flex-col gap-1">
              <p className="text-[14px] font-semibold text-slate-600">Wymagane zbrojenie podwieszające</p>
              <Formula
                tex={String.raw`A_{swp} = \dfrac{1{,}3 \cdot V_{Ed} + 0{,}3 \cdot H_{Sd}}{f_{yd}} = \dfrac{1{,}3 \cdot ${vEdTex} + 0{,}3 \cdot ${hSdTex}}{${fydKNTex}} = \mathbf{${aswpTex}}\ [\text{mm}^2]`}
              />
            </div>

            <div className="mt-4 flex flex-col gap-1">
              <p className="text-[14px] font-semibold text-slate-600">Wymagane zbrojenie uzupełniające</p>
              <Formula
                tex={String.raw`A_{s,link} = \begin{cases} ${underline(String.raw`0{,}5 \cdot \sum A_{s1n}`, linkCase1)} & ${underline(String.raw`\text{dla } a_v/h_k \le 0{,}5\ \text{(strzemiona poziome)}`, linkCase1)} \\[6pt] ${underline(String.raw`0{,}5 \cdot V_{Ed} / f_{yd}`, linkCase2)} & ${underline(String.raw`\text{dla } a_v/h_k > 0{,}5\ \text{(strzemiona pionowe)}`, linkCase2)} \end{cases}`}
              />
              <Formula
                tex={String.raw`\frac{a_v}{h_k} = \mathbf{${avHkTex}} \Rightarrow A_{s,link} = \mathbf{${asLinkTex}}\ [\text{mm}^2]`}
              />
            </div>
          </div>
        )}
      </Collapsible>

      <div className="flex flex-col gap-1">
        <p className="text-[14px] font-semibold text-slate-600">Zbrojenie poziome</p>
        <RebarSelector
          label="pręty główne"
          resultVariable="A_{s11}"
          dotColorClass="bg-[purple]"
          value={{ count: rebar11Count, diameter: rebar11Diameter }}
          onChange={({ count, diameter }) => {
            setRebar11Count(count)
            setRebar11Diameter(diameter)
          }}
        />
        <RebarSelector
          label="pręty drugorzędne"
          resultVariable="A_{s12}"
          dotColorClass="bg-[darkorange]"
          value={{ count: rebar12Count, diameter: rebar12Diameter }}
          onChange={({ count, diameter }) => {
            setRebar12Count(count)
            setRebar12Diameter(diameter)
          }}
        />
        <RebarSelector
          label="pręty trzeciorzędne"
          resultVariable="A_{s13}"
          dotColorClass="bg-[blue]"
          value={{ count: rebar13Count, diameter: rebar13Diameter }}
          onChange={({ count, diameter }) => {
            setRebar13Count(count)
            setRebar13Diameter(diameter)
          }}
        />
      </div>

      <div className="flex items-center gap-2">
        <Formula
          tex={String.raw`\sum A_{s1n} > A_{sp} \Rightarrow \mathbf{${asProvidedTotalTex}}\ [\text{mm}^2] > \mathbf{${aspTex}}\ [\text{mm}^2]`}
        />
        <StatusIcon ok={totalCheckMet} />
        <UtilizationBadge percent={spUtilization} />
      </div>

      <div className="mt-4 flex flex-col gap-1">
        <p className="text-[14px] font-semibold text-slate-600">Zbrojenie podwieszające</p>
        <RebarSelector
          label="pręty podstawowe"
          resultVariable="A_{s21}"
          dotColorClass="bg-[red]"
          value={{ count: rebar31Count, diameter: rebar31Diameter }}
          onChange={({ count, diameter }) => {
            setRebar31Count(count)
            setRebar31Diameter(diameter)
          }}
        />
        <RebarSelector
          label="pręty drugorzędne"
          resultVariable="A_{s22}"
          dotColorClass="bg-[turquoise]"
          value={{ count: rebar32Count, diameter: rebar32Diameter }}
          onChange={({ count, diameter }) => {
            setRebar32Count(count)
            setRebar32Diameter(diameter)
          }}
        />
        <RebarSelectorAuto
          label="strzemiona podwieszające"
          resultVariable="A_{s23}"
          requiredArea={aswp33Required}
          dotColorClass="bg-[yellow]"
          value={{ diameter: rebar33Diameter }}
          onChange={({ diameter }) => setRebar33Diameter(diameter)}
        />
      </div>

      <div className="flex items-center gap-2">
        <Formula
          tex={String.raw`\sum A_{s2n} > A_{swp} \Rightarrow \mathbf{${asProvidedTotal2Tex}}\ [\text{mm}^2] > \mathbf{${aswpTex}}\ [\text{mm}^2]`}
        />
        <StatusIcon ok={totalCheckMet2} />
        <UtilizationBadge percent={swpUtilization} />
      </div>

      <p className="text-[14px] text-slate-600">
        Zbrojenie "podwieszające" rozmieścić na odcinku 0,2h ({Math.round(0.2 * hNum)}mm) od krawędzi
        podcięcia.
      </p>

      <p className="text-[14px] text-slate-600">
        Dla prętów zbrojenia wspornika standardową długość zakotwienia należy przedłużyć poza krawędź
        podcięcia o długość h−d<sub>k</sub> ({Math.round(hNum)}−{Math.round(dK)}={Math.round(hNum - dK)}mm).
      </p>

      <div className="mt-4 flex flex-col gap-1">
        <p className="text-[14px] font-semibold text-slate-600">Zbrojenie uzupełniające</p>
        <p className="text-[14px] text-slate-600">
          {linkCase1
            ? 'Zbrojenie uzupełniające w postaci strzemion poziomych (wsuwki nad zbrojeniem głównym).'
            : 'Zbrojenie uzupełniające w postaci strzemion pionowych rozłożonych na odcinku między krawędzią podcięcia i osią podparcia.'}
        </p>
        <RebarSelectorAuto
          label="zbrojenie uzupełniające"
          resultVariable="A_{s31}"
          requiredArea={asLink}
          dotColorClass="bg-[green]"
          value={{ diameter: rebar21Diameter }}
          onChange={({ diameter }) => setRebar21Diameter(diameter)}
        />
      </div>

      <div className="flex items-center gap-2">
        <Formula
          tex={String.raw`A_{s31} \ge A_{s,link} \Rightarrow \mathbf{${asLinkProvidedTex}}\ [\text{mm}^2] \ge \mathbf{${asLinkTex}}\ [\text{mm}^2]`}
        />
        <StatusIcon ok={linkCheckMet} />
        <UtilizationBadge percent={linkUtilization} />
      </div>
    </div>
  )
}

export default BeamDappedEndResults
