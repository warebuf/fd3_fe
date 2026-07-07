import type { GameState } from "../engine/gameState";
import { Zone } from "../engine/gameState";
import type { CounterStackLog } from "../engine/logs";

export function counterStack(state: GameState, log: CounterStackLog) {

    const i = state.ReactionStack.findIndex(item => item.CardIndex === log.TargetCardIndex);
    if (i !== -1) state.ReactionStack.splice(i, 1);

    const card = state.Cards[log.TargetCardIndex];
    if (card && card.Zone === Zone.Stack) {
        card.Zone = Zone.Graveyard;
        state.Grave[card.Team].push(log.TargetCardIndex);
    }
}
