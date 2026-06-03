
import type { StageLog } from "../engine/logs";
import type { GameState } from "../engine/gameState"

export function stage(state: GameState, log: StageLog) {

    if (log.StageOrder > 0) {
        state.Cards[log.CardIndex].StageOrder = log.StageOrder;
    } else {
        const cleared = state.Cards[log.CardIndex].StageOrder;
        state.Cards[log.CardIndex].StageOrder = 0;
        for (let i = 0; i < state.Cards.length; i++) {
            if (state.Cards[i].Team === log.TeamIndex && state.Cards[i].StageOrder > cleared) {
                state.Cards[i].StageOrder--;
            }
        }
    }

}
