
import type { ReadyLog } from "../engine/logs";
import type { GameState } from "../engine/gameState"

export function ready(state: GameState, log: ReadyLog) {

    state.Ready[log.TeamIndex] = true;

    state.UpdateID = log.UpdateID + 1;

}
