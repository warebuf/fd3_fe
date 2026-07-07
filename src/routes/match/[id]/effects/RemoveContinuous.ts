import type { RemoveContinuousLog } from "../engine/logs";
import { Zone, type GameState } from "../engine/gameState";

export function removeContinuous(state: GameState, log: RemoveContinuousLog) {
    const card = state.Cards[log.CardIndex];
    if (!card) return;

    const arr = state.Continuous[log.TeamIndex];
    const i = arr.indexOf(log.CardIndex);
    if (i !== -1) arr.splice(i, 1);

    card.Zone = Zone.Graveyard;
    state.Grave[log.TeamIndex].push(log.CardIndex);
}
