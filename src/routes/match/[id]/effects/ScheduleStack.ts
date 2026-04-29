
import type { GameState } from "../engine/gameState";
import type { ScheduleStackLog } from "../engine/logs";

export function scheduleStack(state: GameState, log: ScheduleStackLog) {

    for( let i = 0; i < state.ReactionPQ.Items.length; i++) {
        if(log.StackID === state.ReactionPQ.Items[i].StackID) {
            state.ReactionPQ.Items[i].StackEntries.push( log.StackEntry );
            state.ReactionPQ.Items[i].PopTime = log.StackEntry.PopTime;
            console.log("scheduleStack", state.ReactionPQ.Items);
            return;
        }
    }

    // if not found
    state.ReactionPQ.Items.push({
        StackID: log.StackID,
        PopTime: log.StackEntry.PopTime,
        StackEntries: [log.StackEntry],
    });
    console.log("scheduleStack (new)", state.ReactionPQ.Items);

}
