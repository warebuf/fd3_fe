
import type { AutoSummonLog } from "../engine/logs";
import type { GameState } from "../engine/gameState"

export function autoSummon(state: GameState, log: AutoSummonLog) {

    if (log.AutoSummonIdx > 0) {
        state.Cards[log.CardIndex].AutoSummon = log.AutoSummonIdx;
    } else {
        const cleared = state.Cards[log.CardIndex].AutoSummon;
        state.Cards[log.CardIndex].AutoSummon = 0;
        for (let i = 0; i < state.Cards.length; i++) {
            if (state.Cards[i].Team === log.TeamIndex && state.Cards[i].AutoSummon > cleared) {
                state.Cards[i].AutoSummon--;
            }
        }
    }


}
