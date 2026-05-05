
import type { Chain } from "./gameState";
import { ChainStepType } from "./gameState";

export type CardIDToChainStepIndex = { ChainID: number, Index: number };

export function buildRecurringMap(chains: Chain[]): Map<number, CardIDToChainStepIndex> {
    const map = new Map<number, CardIDToChainStepIndex>();
    for (const chain of chains) {
        chain.ChainSteps.forEach((step, i) => {
            if (step.Type === ChainStepType.Recurring)
                map.set(step.CardID, { ChainID: chain.ChainID, Index: i });
        });
    }
    return map;
}
