
import type { HealLog } from "../engine/logs";
import type { GameState } from "../engine/gameState";

export function heal(state: GameState, log: HealLog) {
    state.Cards[log.TargetCardIndex].HP += log.Amount;
}
