
import type { GainManaLog } from "../engine/logs";
import type { GameState } from "../engine/gameState"

export function gainMana(state: GameState, log: GainManaLog) {

    state.Mana[log.TeamIndex] += log.Amount;

    // update GameState UpdateID (i don't think it really matters tbh)
    state.UpdateID = log.UpdateID + 1;

}