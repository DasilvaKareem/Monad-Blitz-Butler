// In-memory balance store for agent wallets
// In production, this would be a database

const balances: Map<string, number> = new Map();

export function getBalance(address: string): number {
  return balances.get(address.toLowerCase()) || 0;
}

export function addBalance(address: string, amount: number): number {
  const current = getBalance(address);
  const newBalance = current + amount;
  balances.set(address.toLowerCase(), newBalance);
  return newBalance;
}

export function spendBalance(address: string, amount: number): number {
  const current = getBalance(address);
  if (current < amount) {
    throw new Error(`Insufficient funds. Has: ${current}, needs: ${amount}`);
  }
  const newBalance = current - amount;
  balances.set(address.toLowerCase(), newBalance);
  return newBalance;
}

export function setBalance(address: string, amount: number): number {
  balances.set(address.toLowerCase(), amount);
  return amount;
}
