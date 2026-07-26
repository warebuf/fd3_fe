import type { GameState } from "../engine/gameState";
import type { RefreshStackLog } from "../engine/logs";

export function refreshStack(state: GameState, log: RefreshStackLog) {

    const item = state.ReactionStack[state.ReactionStack.length - 1];
    if (!item) return;
    item.StartAtActiveTime   = log.StartAtActiveTime;
    item.PopAtActiveTime     = log.PopAtActiveTime;
    item.ExecuteAtActiveTime = log.ExecuteAtActiveTime;
}
