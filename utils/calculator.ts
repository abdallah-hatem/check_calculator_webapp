
export interface Participant {
  id: string;
  name: string;
  orderedAmount: number;
  paidAmount: number;
  isDefault?: boolean;
}

export interface BillDetails {
  delivery: number;
  tax: number;
  service: number;
}

export interface ParticipantResult extends Participant {
  subtotalShare: number;
  taxShare: number;
  serviceShare: number;
  deliveryShare: number;
  totalOwed: number; // What they should have paid
  netBalance: number; // paidAmount - totalOwed. Positive = get money back. Negative = pay money.
}

export function calculateSplits(
  participants: Participant[],
  bill: BillDetails
): ParticipantResult[] {
  const totalOrdered = participants.reduce((sum, p) => sum + p.orderedAmount, 0);
  const participantCount = participants.length;

  if (participantCount === 0) return [];

  return participants.map((p) => {
    // Avoid division by zero
    const shareRatio = totalOrdered > 0 ? p.orderedAmount / totalOrdered : 0;

    // Split Logic:
    // Tax & Service: Proportional to order amount
    const taxShare = bill.tax * shareRatio;
    const serviceShare = bill.service * shareRatio;

    // Delivery: Split equally
    const deliveryShare = bill.delivery / participantCount;

    const totalOwed =
      p.orderedAmount +
      taxShare +
      serviceShare +
      deliveryShare;

    return {
      ...p,
      subtotalShare: p.orderedAmount,
      taxShare,
      serviceShare,
      deliveryShare,
      totalOwed,
      netBalance: p.paidAmount - totalOwed,
    };
  });
}

export interface Settlement {
  from: string;
  to: string;
  amount: number;
}

export function calculateSettlements(results: ParticipantResult[]): Settlement[] {
  // Deep copy to avoid mutating inputs
  const debtors = results
    .filter((r) => r.netBalance < -0.01) // Owe money
    .map((r) => ({ ...r }))
    .sort((a, b) => a.netBalance - b.netBalance); // Ascending (most negative first)

  const creditors = results
    .filter((r) => r.netBalance > 0.01) // Owed money
    .map((r) => ({ ...r }))
    .sort((a, b) => b.netBalance - a.netBalance); // Descending (most positive first)

  const settlements: Settlement[] = [];

  let i = 0; // creditor index
  let j = 0; // debtor index

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];

    // The amount to settle is the minimum of what the debtor owes and what the creditor is owed
    const amount = Math.min(creditor.netBalance, Math.abs(debtor.netBalance));

    if (amount > 0) {
      settlements.push({
        from: debtor.name,
        to: creditor.name,
        amount: Number(amount.toFixed(2)),
      });
    }

    // Adjust balances
    creditor.netBalance -= amount;
    debtor.netBalance += amount;

    // Move indices if settled
    if (creditor.netBalance < 0.01) i++;
    if (debtor.netBalance > -0.01) j++;
  }

  return settlements;
}
