import type { GameState } from "../engine/gameState";
import type { AddTickAbilityLog } from "../engine/logs";

export function addTickAbility(state: GameState, log: AddTickAbilityLog) {
    state.Cards[log.CardIndex].OnTick[log.AbilityIndex] = {
        Active: true,
        Condition: log.Condition,
        StartAtSimTime: log.StartAtSimTime,
        ExecuteAtSimTime: log.ExecuteAtSimTime,
    };
}
