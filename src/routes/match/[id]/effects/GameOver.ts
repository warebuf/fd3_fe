
import type { GameOverLog } from "../engine/logs";
import type { GameState } from "../engine/gameState"

export function gameOver(state: GameState, log: GameOverLog) {
    state.Phase = 5;
    state.Winner = log.Winner;
}
