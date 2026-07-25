import type { GameState } from "../engine/gameState";
import type { ClearAbilityTimerLog } from "../engine/logs";

export function clearAbilityTimer(state: GameState, log: ClearAbilityTimerLog) {
    state.Cards[log.CardIndex].OnTick[log.AbilityIndex] = {
        Active: false,
        Condition: 0,
        StartAtSimTime: 0,
        ExecuteAtSimTime: 0,
    };
}
