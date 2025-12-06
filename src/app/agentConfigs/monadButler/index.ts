import { butlerAgent } from './butler';
import { walletAgent } from './wallet';
import { searchAgent } from './search';

// Wire up handoffs between agents
(butlerAgent.handoffs as any).push(walletAgent, searchAgent);
(walletAgent.handoffs as any).push(butlerAgent, searchAgent);
(searchAgent.handoffs as any).push(butlerAgent, walletAgent);

export const monadButlerScenario = [
  butlerAgent,
  walletAgent,
  searchAgent,
];

export const monadButlerCompanyName = 'Monad Blitz Butler';
