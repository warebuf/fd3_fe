
import type { DeclareCardLog } from "../engine/logs";
import { Zone, type GameState } from "../engine/gameState"

export function declareCard(state: GameState, log: DeclareCardLog) {
    const teamIndex = log.TeamIndex;
    const cardIndex = log.CardIndex;
    const card = state.Cards[cardIndex];

    // a trap declares out of the trap zone, everything else out of hand
    if (card.Zone === Zone.Trap) {
        card.SetStartAtSimTime = 0;
        card.ReadyAtSimTime = 0;
        card.Ready = false;
        // a trap stays in the trap zone while its ability resolves on the chain
    } else {
        const handIdx = state.Hand[teamIndex].indexOf(cardIndex);
        if (handIdx !== -1) state.Hand[teamIndex].splice(handIdx, 1);
        // units/continuous have nowhere else to sit yet; they read as Summoning here via getCardStatus
        card.Zone = Zone.Chain;
    }

    card.AutoSummon = 0;
}
