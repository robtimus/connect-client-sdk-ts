export function formatAmount(amount: number): string {
  if (amount < 10) {
    return "0.0" + amount;
  }
  if (amount < 100) {
    return "0." + amount;
  }
  const output = amount.toString();
  return output.slice(0, output.length - 2) + "." + output.slice(output.length - 2);
}
