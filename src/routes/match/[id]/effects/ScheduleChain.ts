import type { GameState } from "../engine/gameState";
import type { AddChainLog } from "../engine/logs";

export function addChain(state: GameState, log: AddChainLog) {
    state.Chain.push({
        Type: 0,
        CardID: log.CardID,
        StartTime: log.StartAtActiveTime,
        PopTime: 0,
        OccurTime: log.ExecuteAtActiveTime,
        Effects: [],
    });
}
