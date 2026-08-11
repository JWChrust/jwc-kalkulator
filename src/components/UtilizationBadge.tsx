interface UtilizationBadgeProps {
  /** Utilization ratio in percent (demand / capacity * 100). */
  percent: number
}

/** Gray "wytężenie" readout shown next to a pass/fail check. */
function UtilizationBadge({ percent }: UtilizationBadgeProps) {
  return <span className="text-[14px] font-semibold text-slate-500">{Math.round(percent)}%</span>
}

export default UtilizationBadge
