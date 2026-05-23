
import type { SpendManaLog } from "../engine/logs";
import type { GameState } from "../engine/gameState"

export function spendMana(state: GameState, log: SpendManaLog) {

    state.Mana[log.TeamIndex] -= log.Amount;


}
