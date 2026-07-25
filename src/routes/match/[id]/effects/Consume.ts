import type { ConsumeLog } from "../engine/logs";
import type { GameState } from "../engine/gameState";

export function consume(state: GameState, log: ConsumeLog) {
    state.Cards[log.SourceCardIndex].Actives[log.AbilityIndex].Bonus = log.Bonus;
}
