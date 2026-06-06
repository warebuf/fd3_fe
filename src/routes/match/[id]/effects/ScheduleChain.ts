import type { GameState } from "../engine/gameState";
import type { AddStackLog } from "../engine/logs";

export function addStack(state: GameState, log: AddStackLog) {
    console.log(`addStack: cardID=${log.CardID} stackType=${log.StackType}`);
    state.Stack.push({
        Type: log.StackType,
        CardID: log.CardID,
        StartAtActiveTime: log.StartAtActiveTime,
        PopAtActiveTime: log.PopAtActiveTime,
        ExecuteAtActiveTime: log.ExecuteAtActiveTime,
        Effects: log.Effects,
    });
}
