
export interface Timestamp {
    WallTimestamp: number;
    UpdateID: number;
}

export type GameState = {
    UpdateID: number;
    WallTimestamp: number;

    Phase: number;
    PhaseEndInActiveTime: number; // 0 if no fixed end

    PausePhase: number;
    FullPauseStartedAt: number;
    SimPauseStartedAt: number;
    FullPauseOffset: number;
    SimPauseOffset: number;
    TeamPaused: number;
    TimeBank: number[];

    Cards: Card[];
    Deck: number[][];
    Hand: number[][];
    Field: number[][];
    Grave: number[][];
    Traps: number[][]; // set but not yet activated
    Equip: number[][];

    Chain: ChainItem[];

    Mana: number[];
    Structures: Structure[][]; // per team, then per structure slot
    Ready: boolean[];
    SkipChain: boolean[];

    // Standoff-style blind mana auction. -1/[-1,-1] when none is open. -1: not yet sealed. -2:
    // sealed by the opponent but still hidden from us. >=0: a real amount (ours, or revealed).
    StandoffCardIndex: number;
    PendingBidAmount: number[]; // per team

    Winner: number; // -1: no winner, 0+: winning team index
};

export const PausePhase = {
    FullPause:   0,
    SimPause:    1,
    Simulating:  2,
} as const;

export const Phase = {
    PreMatch: 0,
    Draw: 1,
    Play: 2,
    GameEnd: 3,
} as const;

export const Zone = {
    Deck: 0,
    Hand: 1,
    Field: 2,
    Graveyard: 3,
    Pending: 4,
    Trap: 5,
    Equip: 6,
} as const;

// mirrors engine/state.ChainEntry
export const ChainEntry = {
    Dual: 0,
    Action: 1,
    Reaction: 2,
} as const;

// mirrors engine/state.ChainType
export const ChainItemType = {
    UnitAbility: 1,
    Trap: 2,
    Summon: 3,
    StructureAbility: 4,
    Equip: 5,
} as const;

export const CardType = {
    Structure: 0,
    Unit: 1,
    Trap: 2,
    Equip: 3,
} as const;

// mirrors engine/state.EffectType
export const EffectType = {
    Attack:            1,
    Draw:              2,
    Mana:              3,
    Destroy:           4,
    Counter:           5,
    ChargeSelf:        6,
    Consume:           7,
    SelfDestruct:      8,
    ChargeTarget:      9,
    AbsorbDestruction: 10,
    GiveControl:       11,
    HealNonDamaging:   12,
    Extort:            13,
    DamageAllAllies:   14,
    DrainMana:         15,
    Liquidate:         16,
    MutualDestruction: 17,
    GraveyardBarrage:  18,
    ScalingSpillover:  19,
    SpawnTokens:       20,
    Leech:             21,
} as const;

export interface Structure {
    DefNo: number;
    Name: string;
    Description: string;
    DrawCost: number;
    HP: number;
    AutoAbility: boolean;
}

export const TickCondition = {
    Indefinite: 0,
    UntilChargeMax: 1,
} as const;

// mirrors engine/state.TickAbility: one slot per Card.OnTick[3] index, zero-valued when inactive
export interface TickAbility {
    Active: boolean;
    Condition: number;
    StartAtSimTime: number;
    ExecuteAtSimTime: number;
}

// mirrors engine/state.ActiveAbility: one slot per Card.Actives[3] index
export interface ActiveAbility {
    Target: number; // preselected target for this ability slot, -1 if none
    TargetFlags: number;
    Cons: [number, number, number];
    Cost: number;
    CanAutoFire: boolean; // whether this ability may be toggled to auto-fire at all
    AutoAbility: boolean;
    ChainEntry: number;
    Bonus: number;
}

export interface OnPlayAbility {
    Target: number; // preselected target for this OnPlay slot, -1 if none
    TargetFlags: number;
}

export const TargetFlags = {
    Self:     1 << 0,
    OwnField: 1 << 1,
    OppField: 1 << 2,
    OwnHand:  1 << 3,
    OppHand:  1 << 4,
    OwnTrap:  1 << 5,
    OppTrap:  1 << 6,
} as const;

export function isValidTarget(cards: Card[], targetFlags: number, sourceIdx: number, targetIdx: number, teamIndex: number): boolean {
    if (targetFlags === 0 || targetIdx < 0 || targetIdx >= cards.length) return false;
    const target = cards[targetIdx];
    if (!target) return false;
    if (targetIdx === sourceIdx) return (targetFlags & TargetFlags.Self) !== 0;
    if (target.Team === teamIndex && target.Zone === Zone.Field)      return (targetFlags & TargetFlags.OwnField) !== 0;
    if (target.Team !== teamIndex && target.Zone === Zone.Field)      return (targetFlags & TargetFlags.OppField) !== 0;
    if (target.Team === teamIndex && target.Zone === Zone.Hand)       return (targetFlags & TargetFlags.OwnHand) !== 0;
    if (target.Team !== teamIndex && target.Zone === Zone.Hand)       return (targetFlags & TargetFlags.OppHand) !== 0;
    if (target.Team === teamIndex && target.Zone === Zone.Trap)       return (targetFlags & TargetFlags.OwnTrap) !== 0;
    if (target.Team !== teamIndex && target.Zone === Zone.Trap)       return (targetFlags & TargetFlags.OppTrap) !== 0;
    return false;
}

// which ability array a card's preselect targets, depending on which zone it's in
export function preselectableAbilities(card: Card): (ActiveAbility | OnPlayAbility)[] {
    return card.Zone === Zone.Hand ? card.OnPlay : card.Actives;
}

export const Archetype = {
    None: 0,
    Tree: 1,
} as const;


export interface Card {
    DefNo: number;
    Name: string;
    Description: string;
    Cost: number;
    HP: number;
    Archetype: number;
    Taunt: boolean;
    Bodyguard: boolean;

    Team: number; // current controller; changes on control-changing effects
    Type: number;
    Zone: number;
    IsToken: boolean;
    ChainEntry: number;

    // charge related - shared pool for this card; any ability slot may gain or spend from it
    Charges: number;
    MaxCharges: number;
    PendingCharges: number; // activations currently in flight on the chain across all Active slots, not yet resolved

    // trap related, only meaningful while this card sits in Zone.Trap
    SetStartAtSimTime: number;
    ReadyAtSimTime: number;
    Ready: boolean;

    AutoSummon: number;
    OnTick: TickAbility[];
    Actives: ActiveAbility[];
    OnPlay: OnPlayAbility[];

    EquipHostIndex: number; // -1 is no host
}

export interface Effect {
    Type: number;
    A: number;
    B: number;
    C: number;
}

export interface ChainItem {
    Type: number;
    CardIndex: number;
    ActiveIndex: number; // which Actives[] slot this item's activation came from, -1 if not an Active ability
    TeamIndex: number;
    StartAtActiveTime: number;
    PopAtActiveTime: number;
    ExecuteAtActiveTime: number;
    Effects: Effect[];
}


export function initGameState(): GameState {
    return {
        UpdateID: 0,
        WallTimestamp: Date.now(),
        Phase: 0,
        PhaseEndInActiveTime: 0,

        PausePhase: 2,
        FullPauseStartedAt: 0,
        SimPauseStartedAt: 0,
        FullPauseOffset: 0,
        SimPauseOffset: 0,
        TeamPaused: -1,
        TimeBank: [0, 0],

        Cards: [],
        Deck: [[], []],
        Hand: [[], []],
        Field: [[], []],
        Grave: [[], []],
        Traps: [[], []],
        Equip: [[], []],

        Chain: [],

        Mana: [],
        Structures: [[], []],
        Ready: [false, false],
        SkipChain: [false, false],

        StandoffCardIndex: -1,
        PendingBidAmount: [-1, -1],

        Winner: -1,
    };
}

export function cloneGameState(src: GameState): GameState {
    return {
        UpdateID: src.UpdateID,
        WallTimestamp: src.WallTimestamp,
        Phase: src.Phase,
        PhaseEndInActiveTime: src.PhaseEndInActiveTime,

        PausePhase: src.PausePhase,
        FullPauseStartedAt: src.FullPauseStartedAt,
        SimPauseStartedAt: src.SimPauseStartedAt,
        FullPauseOffset: src.FullPauseOffset,
        SimPauseOffset: src.SimPauseOffset,
        TeamPaused: src.TeamPaused,
        TimeBank: [...src.TimeBank],

        Cards: src.Cards.map(card => ({
            ...card,
            OnTick: card.OnTick.map(t => ({ ...t })),
            Actives: card.Actives.map(a => ({ ...a, Cons: [...a.Cons] as [number, number, number] })),
            OnPlay: card.OnPlay.map(o => ({ ...o })),
        })),
        Deck: src.Deck.map(d => [...d]),
        Hand: src.Hand.map(h => [...h]),
        Field: src.Field.map(f => [...f]),
        Grave: src.Grave.map(g => [...g]),
        Traps: (src.Traps ?? [[], []]).map(t => [...t]),
        Equip: (src.Equip ?? [[], []]).map(e => [...e]),

        Chain: src.Chain.map(item => ({ ...item, Effects: [...item.Effects] })),

        Mana: [...src.Mana],
        Structures: (src.Structures ?? [[], []]).map(team => team.map(s => ({ ...s }))),
        Ready: [...src.Ready],
        SkipChain: [...src.SkipChain],

        StandoffCardIndex: src.StandoffCardIndex ?? -1,
        PendingBidAmount: [...(src.PendingBidAmount ?? [-1, -1])],

        Winner: src.Winner,
    };
}
