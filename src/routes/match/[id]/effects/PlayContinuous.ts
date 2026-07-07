import type { PlayContinuousLog } from "../engine/logs";
import { Zone, type GameState } from "../engine/gameState";

export function playContinuous(state: GameState, log: PlayContinuousLog) {
    const card = state.Cards[log.CardIndex];
    if (!card) return;

    card.Zone = Zone.Continuous;

    state.Continuous[log.TeamIndex].push(log.CardIndex);
}
