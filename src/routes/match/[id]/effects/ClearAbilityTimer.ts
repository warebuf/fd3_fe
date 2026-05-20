import type { GameState } from "../engine/gameState";
import type { ClearAbilityTimerLog } from "../engine/logs";

export function clearAbilityTimer(state: GameState, log: ClearAbilityTimerLog) {
    const timers = state.Cards[log.CardIndex].AbilityTimers;
    const i = timers.findIndex(t => t.AbilityID === log.AbilityID);
    if (i !== -1) timers.splice(i, 1);
}
