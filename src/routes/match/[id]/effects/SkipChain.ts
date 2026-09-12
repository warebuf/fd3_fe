import type { SkipChainLog } from "../engine/logs";
import type { GameState } from "../engine/gameState"

export function skipChain(state: GameState, log: SkipChainLog) {

    state.SkipChain[log.TeamIndex] = true;

}
