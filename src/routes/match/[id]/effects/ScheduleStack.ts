
import type { GameState } from "../engine/gameState";
import type { ScheduleStackLog } from "../engine/logs";

export function scheduleStack(state: GameState, log: ScheduleStackLog) {

    console.log("scheduleStack", log);

    // check if stack exists, if so add an entry
    for( let i = 0; i < state.ReactionPQ.Items.length; i++) {
        if(log.StackID === state.ReactionPQ.Items[i].StackID) {
            state.ReactionPQ.Items[i].StackEntries.push( log.StackEntry );
            state.ReactionPQ.Items[i].PopTime = log.StackEntry.PopTime;
            console.log("scheduleStack", state.ReactionPQ.Items);
            return;
        }
    }

    // if not found, create a new stack
    state.ReactionPQ.Items.push({
        StackID: log.StackID,
        PopTime: log.StackEntry.PopTime,
        StackEntries: [log.StackEntry],
    });

}
