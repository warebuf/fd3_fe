import type { GameState } from "../engine/gameState";
import type { AddStackLog } from "../engine/logs";

export function addStack(state: GameState, log: AddStackLog) {

    state.ReactionStack.push({
        Type: log.StackType,
        CardIndex: log.CardIndex,
        ActiveIndex: log.ActiveIndex,
        TeamIndex: log.TeamIndex,
        StartAtActiveTime: log.StartAtActiveTime,
        PopAtActiveTime: log.PopAtActiveTime,
        ExecuteAtActiveTime: log.ExecuteAtActiveTime,
        Effects: log.Effects,
    });
}
