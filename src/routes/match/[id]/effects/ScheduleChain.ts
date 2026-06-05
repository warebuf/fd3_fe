import type { GameState } from "../engine/gameState";
import type { AddChainLog } from "../engine/logs";

export function addChain(state: GameState, log: AddChainLog) {
    console.log(`addChain: cardID=${log.CardID} chainType=${log.ChainType}`);
    state.Chain.push({
        Type: log.ChainType,
        CardID: log.CardID,
        StartAtActiveTime: log.StartAtActiveTime,
        PopAtActiveTime: log.PopAtActiveTime,
        ExecuteAtActiveTime: log.ExecuteAtActiveTime,
        Effects: log.Effects,
    });
}
