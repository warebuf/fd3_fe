import type { RemoveContinuousLog } from "../engine/logs";
import { Zone, CardStatus, type GameState } from "../engine/gameState";

export function removeContinuous(state: GameState, log: RemoveContinuousLog) {
    const card = state.Cards[log.CardID];
    if (!card) return;

    const arr = state.Continuous[log.TeamIndex];
    const i = arr.indexOf(log.CardID);
    if (i !== -1) arr.splice(i, 1);

    card.Zone = Zone.Graveyard;
    card.Status = CardStatus.Default;
    state.Grave[log.TeamIndex].push(log.CardID);
}
