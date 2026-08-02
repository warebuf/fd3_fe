import type { SpawnTokenLog } from "../engine/logs";
import { Zone, type Card, type GameState } from "../engine/gameState";

export function spawnToken(state: GameState, log: SpawnTokenLog) {
    const card: Card = {
        DefNo: log.DefNo,
        Name: log.Name,
        Description: log.Description,
        Cost: log.Cost,
        HP: log.HP,
        Archetype: log.Archetype,
        Taunt: false,

        Team: log.TeamIndex,
        Type: log.CardType,
        Zone: Zone.Field,
        IsToken: log.IsToken,

        Charges: 0,
        MaxCharges: 0,
        PendingCharges: 0,

        AutoSummon: 0,
        OnTick: [],
        Actives: [],
        OnPlay: [],
    };

    state.Cards[log.CardIndex] = card;
    state.Field[log.TeamIndex].push(log.CardIndex);
}
