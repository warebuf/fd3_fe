import type { GameState } from "../engine/gameState";
import { Zone } from "../engine/gameState";
import type { CounterStackLog } from "../engine/logs";

export function counterStack(state: GameState, log: CounterStackLog) {

    state.ReactionStack.pop();

    const card = state.Cards[log.TargetCardIndex];
    if (card && card.Zone === Zone.Stack) {
        card.Zone = Zone.Graveyard;
        state.Grave[card.Team].push(log.TargetCardIndex);
    }
}
