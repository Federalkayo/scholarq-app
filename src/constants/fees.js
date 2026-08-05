export const GRADE_OPTIONS = [
  'Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5',
  'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'
];

export const STATUS_OPTIONS = ['Paid', 'Pending', 'Partially Paid', 'Overdue'];

export const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'POS', 'Debit/Credit Card', 'Cheque'];

export const PAYMENT_METHOD_ICONS = {
  'Cash': 'payments',
  'Bank Transfer': 'account_balance',
  'POS': 'point_of_sale',
  'Debit/Credit Card': 'credit_card',
  'Cheque': 'receipt_long'
};

export const FEE_TYPE_OPTIONS = [
  'Tuition', 'Development Levy', 'Exam Fee', 'Uniform', 'Books & Materials',
  'Transport', 'Boarding', 'PTA Levy', 'Other'
];

export function computeStatus(amountDue, amountPaid) {
  const due = Number(amountDue) || 0;
  const paid = Number(amountPaid) || 0;
  if (paid <= 0) return 'Pending';
  if (paid < due) return 'Partially Paid';
  return 'Paid';
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function formatCurrency(amount) {
  return `$${(amount || 0).toLocaleString()}`;
}
