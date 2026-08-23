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
        ChainEntry: log.ChainEntry,

        Charges: 0,
        MaxCharges: 0,
        PendingCharges: 0,

        SetStartAtSimTime: 0,
        ReadyAtSimTime: 0,
        Ready: false,

        AutoSummon: 0,
        OnTick: [],
        Actives: [],
        OnPlay: [],
        EquipHostIndex: -1,
    };

    state.Cards[log.CardIndex] = card;
    state.Field[log.TeamIndex].push(log.CardIndex);
}
