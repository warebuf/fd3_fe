import type { GameState } from "../engine/gameState";
import type { AddAbilityTimerLog } from "../engine/logs";

export function addAbilityTimer(state: GameState, log: AddAbilityTimerLog) {
    state.Cards[log.CardIndex].OnTick[log.AbilityIndex] = {
        Active: true,
        Condition: log.Condition,
        StartAtSimTime: log.StartAtSimTime,
        ExecuteAtSimTime: log.ExecuteAtSimTime,
    };
}
