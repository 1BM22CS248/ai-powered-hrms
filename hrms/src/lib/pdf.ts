import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { PayrollRecord } from '../data/types'
import { formatINR, formatDate, formatMonth } from './format'

export function generatePayslip(record: PayrollRecord): Blob {
  const doc = new jsPDF()

  // Header
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('HRMS — Payslip', 105, 20, { align: 'center' })

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(`Employee: ${record.employeeName}`, 14, 35)
  doc.text(`Department: ${record.departmentName}`, 14, 42)
  doc.text(`Pay Period: ${formatMonth(record.month)}`, 14, 49)
  doc.text(`Status: ${record.status.toUpperCase()}`, 14, 56)
  if (record.paidAt) doc.text(`Paid On: ${formatDate(record.paidAt)}`, 14, 63)

  // Earnings table
  autoTable(doc, {
    startY: 72,
    head: [['Earnings', 'Amount']],
    body: [
      ['Basic Salary', formatINR(record.basicSalary)],
      ['HRA', formatINR(record.hra)],
      ['Conveyance', formatINR(record.conveyance)],
      ['Medical Allowance', formatINR(record.medicalAllowance)],
      ['Bonus', formatINR(record.bonus)],
      ['Gross Salary', formatINR(record.grossSalary)],
    ],
    theme: 'striped',
    headStyles: { fillColor: [37, 99, 235] },
  })

  const earningsY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8

  // Deductions table
  autoTable(doc, {
    startY: earningsY,
    head: [['Deductions', 'Amount']],
    body: [
      ['Provident Fund (12%)', formatINR(record.pf)],
      ['Income Tax', formatINR(record.tax)],
      ['Other Deductions', formatINR(record.otherDeductions)],
      ['Total Deductions', formatINR(record.totalDeductions)],
    ],
    theme: 'striped',
    headStyles: { fillColor: [220, 38, 38] },
  })

  const deductionsY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8

  // Net pay
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(`Net Pay: ${formatINR(record.netPay)}`, 14, deductionsY + 6)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'italic')
  doc.text('This is a computer-generated payslip. No signature required.', 105, 285, { align: 'center' })

  return doc.output('blob')
}
