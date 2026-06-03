
import type { UnreadyLog } from "../engine/logs";
import type { GameState } from "../engine/gameState"

export function unready(state: GameState, log: UnreadyLog) {

    state.Ready[log.TeamIndex] = false;

}
