import type { PreselectLog } from "../engine/logs";
import type { GameState } from "../engine/gameState";

export function preselect(state: GameState, log: PreselectLog) {
    const card = state.Cards[log.CardID];
    if (!card) return;
    card.Targets[0] = log.TargetCardIndex;
}
