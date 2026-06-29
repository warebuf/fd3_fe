import type { PlayContinuousLog } from "../engine/logs";
import { Zone, CardStatus, type GameState } from "../engine/gameState";

export function playContinuous(state: GameState, log: PlayContinuousLog) {
    const card = state.Cards[log.CardID];
    if (!card) return;

    card.Zone = Zone.Continuous;
    card.Status = CardStatus.ContinuousActive;

    state.Continuous[log.TeamIndex].push(log.CardID);
}
