import type { UnskipChainLog } from "../engine/logs";
import type { GameState } from "../engine/gameState"

export function unskipChain(state: GameState, log: UnskipChainLog) {

    state.SkipChain[log.TeamIndex] = false;

}
