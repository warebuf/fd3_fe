
import type { SummonResolutionLog } from "../engine/logs";
import { CardStatus, type GameState } from "../engine/gameState"

export function summonUnit(state: GameState, log: SummonResolutionLog) {

    let teamIndex = log.TeamIndex;
    let cardIndex = log.CardIndex;

    state.Cards[cardIndex].Status = CardStatus.Online;

    // apply any effects
    // apply any triggers


}