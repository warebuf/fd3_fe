import type { GameState } from "../engine/gameState";
import type { AddChainLog } from "../engine/logs";

export function addChain(state: GameState, log: AddChainLog) {

    state.Chain.push({
        Type: log.ChainType,
        CardIndex: log.CardIndex,
        ActiveIndex: log.ActiveIndex,
        TeamIndex: log.TeamIndex,
        StartAtActiveTime: log.StartAtActiveTime,
        PopAtActiveTime: log.PopAtActiveTime,
        ExecuteAtActiveTime: log.ExecuteAtActiveTime,
        Effects: log.Effects,
    });
}
