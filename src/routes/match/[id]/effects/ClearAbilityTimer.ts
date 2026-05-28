import type { GameState } from "../engine/gameState";
import type { ClearAbilityTimerLog } from "../engine/logs";

export function clearAbilityTimer(state: GameState, log: ClearAbilityTimerLog) {
    const timers = state.Cards[log.CardIndex].AbilityTimers;
    for (let i = 0; i < timers.length; i++) {
        if (timers[i].AbilityID === log.AbilityID) {
            timers.splice(i, 1);
            break;
        }
    }
}
