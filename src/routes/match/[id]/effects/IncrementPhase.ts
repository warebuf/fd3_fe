
import type { PhaseLog } from "../engine/logs";
import type { GameState } from "../engine/gameState"

export function incrementPhase(state: GameState, log: PhaseLog) {

    state.Phase = log.Phase;
    state.PhaseEndInActiveTime = log.PhaseEndInActiveTime;

    if (log.Phase === 3) {
        state.Ready = state.Ready.map(() => false);
    }

    if (log.Phase === 4) {
        for (let i = 0; i < state.Cards.length; i++) {
            state.Cards[i].StageOrder = 0;
        }
    }


}