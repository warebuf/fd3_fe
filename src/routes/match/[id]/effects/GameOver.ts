
import type { GameOverLog } from "../engine/logs";
import type { GameState } from "../engine/gameState"
import { Phase } from "../engine/gameState"

export function gameOver(state: GameState, log: GameOverLog) {
    state.Phase = Phase.GameEnd;
    state.Winner = log.Winner;
}
