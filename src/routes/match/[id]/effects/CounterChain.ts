import type { GameState } from "../engine/gameState";
import { Zone, CardStatus } from "../engine/gameState";
import type { CounterStackLog } from "../engine/logs";

export function counterStack(state: GameState, log: CounterStackLog) {

    const i = state.Stack.findIndex(item => item.CardID === log.TargetCardID);
    if (i !== -1) state.Stack.splice(i, 1);

    const card = state.Cards[log.TargetCardID];
    if (card && card.Zone === Zone.Stack) {
        card.Zone = Zone.Graveyard;
        card.Status = CardStatus.Default;
        state.Grave[card.Team].push(log.TargetCardID);
    }
}
