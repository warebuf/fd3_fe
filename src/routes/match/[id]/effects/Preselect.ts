import type { PreselectLog } from "../engine/logs";
import type { GameState } from "../engine/gameState";

export function preselect(state: GameState, log: PreselectLog) {
    const card = state.Cards[log.CardIndex];
    if (!card) return;
    card.Actives[log.AbilityIndex].Target = log.TargetCardIndex;
}
