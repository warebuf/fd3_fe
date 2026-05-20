import type { GameState } from "../engine/gameState";
import type { AddAbilityTimerLog } from "../engine/logs";

export function addAbilityTimer(state: GameState, log: AddAbilityTimerLog) {
    state.Cards[log.CardIndex].AbilityTimers.push({
        AbilityID: log.AbilityID,
        AbilityIdx: log.AbilityIdx,
        Type: log.TimerType,
        StartAtSimTime: log.StartAtSimTime,
        ExecuteAtSimTime: log.ExecuteAtSimTime,
    });
}
