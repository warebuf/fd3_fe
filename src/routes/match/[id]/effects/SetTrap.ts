import type { SetTrapLog } from "../engine/logs";
import { Zone, type GameState } from "../engine/gameState";

export function setTrap(state: GameState, log: SetTrapLog) {
    const card = state.Cards[log.CardIndex];
    if (!card) return;

    card.Zone = Zone.Trap;
    card.SetStartAtSimTime = log.SetStartAtSimTime;
    card.ReadyAtSimTime = log.ReadyAtSimTime;
    card.Ready = false;
    card.AutoSummon = 0;

    const hand = state.Hand[log.TeamIndex];
    const i = hand.indexOf(log.CardIndex);
    if (i !== -1) hand.splice(i, 1);

    state.Traps[log.TeamIndex].push(log.CardIndex);
}
