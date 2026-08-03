// Computes a real monthly fee-collection trend from live invoice data
// (replaces the old hand-typed placeholder arrays in Fees.jsx / Reports.jsx).
//
// Each invoice is expected to have: { amount: number, status: 'Paid' | 'Pending' | 'Overdue', dueDate: string }
// Invoices are bucketed by the month of their `dueDate`.

export function getLastNMonths(n) {
  const months = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('en-US', { month: 'short' })
    });
  }
  return months;
}

function monthKeyFromDueDate(dueDate) {
  if (!dueDate) return null;
  const d = new Date(dueDate);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function computeFeeTrend(invoices, monthsBack = 5) {
  const months = getLastNMonths(monthsBack);

  const byMonth = months.map((m) => {
    const monthInvoices = invoices.filter((inv) => monthKeyFromDueDate(inv.dueDate) === m.key);
    const expected = monthInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const collected = monthInvoices
      .filter((inv) => inv.status === 'Paid')
      .reduce((sum, inv) => sum + (inv.amount || 0), 0);
    return { month: m.label, expected, collected, hasData: monthInvoices.length > 0 };
  });

  const maxExpected = Math.max(1, ...byMonth.map((m) => m.expected));

  return byMonth.map((m) => ({
    month: m.month,
    expectedHeight: `${Math.round((m.expected / maxExpected) * 100)}%`,
    collectedHeight: `${Math.round((m.collected / maxExpected) * 100)}%`,
    amount: `$${Math.round(m.collected).toLocaleString()} collected`,
    hasData: m.hasData
  }));
}
