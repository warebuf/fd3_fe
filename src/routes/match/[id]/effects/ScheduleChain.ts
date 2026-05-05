
import type { GameState } from "../engine/gameState";
import type { ScheduleChainLog } from "../engine/logs";

export function scheduleChain(state: GameState, log: ScheduleChainLog) {

    // check if chain exists, if so add a step
    for( let i = 0; i < state.ReactionPQ.Items.length; i++) {
        if(log.ChainID === state.ReactionPQ.Items[i].ChainID) {
            state.ReactionPQ.Items[i].ChainSteps.push( log.Step );
            state.ReactionPQ.Items[i].PopTime = log.Step.PopTime;
            return;
        }
    }

    // if not found, create a new chain
    state.ReactionPQ.Items.push({
        ChainID: log.ChainID,
        PopTime: log.Step.PopTime,
        ChainSteps: [log.Step],
    });

}
