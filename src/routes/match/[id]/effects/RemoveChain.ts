import type { GameState } from "../engine/gameState";
import { Zone, CardStatus } from "../engine/gameState";
import type { RemoveStackLog } from "../engine/logs";

export function removeStack(state: GameState, log: RemoveStackLog) {

    const i = state.Stack.findIndex(item => item.CardID === log.CardID);
    if (i !== -1) state.Stack.splice(i, 1);

    const card = state.Cards[log.CardID];
    if (card && card.Zone === Zone.Stack) {
        card.Zone = Zone.Graveyard;
        card.Status = CardStatus.Default;
        state.Grave[card.Team].push(log.CardID);
    }
    
}
