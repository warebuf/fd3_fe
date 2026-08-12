import type { GameState } from "../engine/gameState";
import type { ClearTickAbilityLog } from "../engine/logs";

export function clearTickAbility(state: GameState, log: ClearTickAbilityLog) {
    state.Cards[log.CardIndex].OnTick[log.AbilityIndex] = {
        Active: false,
        Condition: 0,
        StartAtSimTime: 0,
        ExecuteAtSimTime: 0,
    };
}
