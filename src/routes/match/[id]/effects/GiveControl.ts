import type { GiveControlLog } from "../engine/logs";
import type { GameState } from "../engine/gameState";

export function giveControl(state: GameState, log: GiveControlLog) {

    const card = state.Cards[log.CardIndex];
    if (!card) return;

    const fromArr = state.Field[log.FromTeamIndex];
    for (let i = 0; i < fromArr.length; i++) {
        if (fromArr[i] === log.CardIndex) {
            fromArr.splice(i, 1);
            break;
        }
    }

    state.Field[log.ToTeamIndex].push(log.CardIndex);
    card.Team = log.ToTeamIndex;

    for (const active of card.Actives) {
        active.Target = -1;
        active.AutoAbility = false;
    }
}
