
import type { GainManaLog } from "../engine/logs";
import type { GameState } from "../engine/gameState"

export function gainMana(state: GameState, log: GainManaLog) {

    state.Mana[log.TeamIndex] += log.Amount;


}