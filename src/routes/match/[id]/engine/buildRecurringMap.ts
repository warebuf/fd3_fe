import type { SimulationItem } from "./gameState";

export function buildRecurringMap(items: SimulationItem[]): Map<number, SimulationItem> {
    const map = new Map<number, SimulationItem>();
    for (const item of items) {
        map.set(item.CardID, item);
    }
    return map;
}
