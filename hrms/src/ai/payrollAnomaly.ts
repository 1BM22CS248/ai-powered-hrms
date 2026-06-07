import type { PayrollRecord, AnomalyFlag } from '../data/types'

// Heuristic — no LLM call.
// Flag a payroll record if net pay deviates > 20% from the department median for that month.

export function detectPayrollAnomalies(
  records: PayrollRecord[],
  deptMedians: Map<string, number>,
): AnomalyFlag[] {
  const flags: AnomalyFlag[] = []

  for (const r of records) {
    const median = deptMedians.get(r.departmentName)
    if (!median || median === 0) continue

    const deviation = ((r.netPay - median) / median) * 100
    if (Math.abs(deviation) > 20) {
      flags.push({
        employeeId: r.employeeId,
        payrollId: r.id,
        deviation: parseFloat(deviation.toFixed(1)),
        reason: deviation > 0
          ? `Net pay ${deviation.toFixed(0)}% above dept median (${r.departmentName})`
          : `Net pay ${Math.abs(deviation).toFixed(0)}% below dept median (${r.departmentName})`,
      })
    }
  }

  return flags
}
