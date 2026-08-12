import type { GameState } from "../engine/gameState";
import type { RefreshChainLog } from "../engine/logs";

export function refreshChain(state: GameState, log: RefreshChainLog) {

    const item = state.Chain[state.Chain.length - 1];
    if (!item) return;
    item.StartAtActiveTime   = log.StartAtActiveTime;
    item.PopAtActiveTime     = log.PopAtActiveTime;
    item.ExecuteAtActiveTime = log.ExecuteAtActiveTime;
}
