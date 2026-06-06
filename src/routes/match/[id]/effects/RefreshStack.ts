import type { GameState } from "../engine/gameState";
import type { RefreshStackLog } from "../engine/logs";

export function refreshStack(state: GameState, log: RefreshStackLog) {

    const item = state.Stack.find(item => item.CardID === log.CardID);
    if (!item) return;
    item.StartAtActiveTime   = log.StartAtActiveTime;
    item.PopAtActiveTime     = log.PopAtActiveTime;
    item.ExecuteAtActiveTime = log.ExecuteAtActiveTime;
}
