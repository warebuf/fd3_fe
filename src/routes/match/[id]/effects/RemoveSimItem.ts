import type { GameState } from "../engine/gameState";
import type { RemoveSimItemLog } from "../engine/logs";

export function removeSimItem(state: GameState, log: RemoveSimItemLog) {
    const i = state.SimulationPQ.Items.findIndex(item => item.CardID === log.CardID);
    if (i !== -1) state.SimulationPQ.Items.splice(i, 1);
}
