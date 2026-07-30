
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
    Continuous: number[][];

    ReactionStack: StackItem[];

    Mana: number[];
    Structures: Structure[];
    Ready: boolean[];

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
    BoardSetup: 2,
    Reveal: 3,
    Play: 4,
    GameEnd: 5,
} as const;

export const Zone = {
    Deck: 0,
    Hand: 1,
    Field: 2,
    Graveyard: 3,
    Stack: 4,
    Continuous: 5,
} as const;

// mirrors engine/state.ReactionType
export const StackItemType = {
    UnitAbility: 1,
    Spell: 2,
    ContinuousAbility: 3,
    Summon: 4,
    ContinuousResolution: 5,
    StructureAbility: 6,
} as const;

export const CardType = {
    Structure: 0,
    Unit: 1,
    Trap: 2,
    Spell: 3,
    Continuous: 4,
} as const;

// mirrors engine/state.EffectType
export const EffectType = {
    Attack:      1,
    Heal:        2,
    Draw:        3,
    Mana:        4,
    Destroy:     5,
    Counter:     6,
    ChargeSelf:  7,
    Sacrifice:   8,
    Consume:     9,
    SelfDestruct: 10,
    ConvertToTokens: 11,
    ChargeTarget: 12,
} as const;

export interface Structure {
    DefNo: number;
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
    Unlimited: boolean; // if true, this ability ignores the card's Charges entirely and is always available
    Target: number; // preselected target for this ability slot, -1 if none
    TargetFlags: number;
    Cons: [number, number, number];
    Cost: number;
    CanAutoFire: boolean; // whether this ability may be toggled to auto-fire at all
    AutoAbility: boolean;
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
    OwnCont:  1 << 5,
    OppCont:  1 << 6,
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
    if (target.Team === teamIndex && target.Zone === Zone.Continuous) return (targetFlags & TargetFlags.OwnCont) !== 0;
    if (target.Team !== teamIndex && target.Zone === Zone.Continuous) return (targetFlags & TargetFlags.OppCont) !== 0;
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

export const CardStatus = {
    Default:           0, // spells, structures, continuous
    Summoning:         1, // unit: on field, summon window not yet resolved
    UnitActive:        2, // unit: fully resolved and active
    Set:               3, // trap: face-down on field
    TrapActive:        4, // trap: triggered/active
    ContinuousActive:  5, // continuous spell: in continuous zone
} as const;

// Status isn't sent by the backend; it's a client-side view derived from Zone/Type.
export function getCardStatus(card: Card): number {
    if (card.Type === CardType.Unit) {
        if (card.Zone === Zone.Stack) return CardStatus.Summoning;
        if (card.Zone === Zone.Field) return CardStatus.UnitActive;
    }
    if (card.Zone === Zone.Continuous) return CardStatus.ContinuousActive;
    return CardStatus.Default;
}

export interface Card {
    DefNo: number;
    Name: string;
    Description: string;
    Cost: number;
    HP: number;
    Archetype: number;
    Taunt: boolean;

    Team: number;
    Type: number;
    Zone: number;
    IsToken: boolean;

    // charge related - shared pool for this card; any ability slot may gain or spend from it
    Charges: number;
    MaxCharges: number;
    PendingCharges: number; // activations currently in flight on the stack across all Active slots, not yet resolved

    StageOrder: number;
    AutoSummon: number;
    OnTick: TickAbility[];
    Actives: ActiveAbility[];
    OnPlay: OnPlayAbility[];
}

export interface Effect {
    Type: number;
    A: number;
    B: number;
    C: number;
}

export interface StackItem {
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
        Continuous: [[], []],

        ReactionStack: [],

        Mana: [],
        Structures: [],
        Ready: [false, false],

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
        Continuous: src.Continuous.map(c => [...c]),

        ReactionStack: src.ReactionStack.map(item => ({ ...item, Effects: [...item.Effects] })),

        Mana: [...src.Mana],
        Structures: src.Structures.map(s => ({ ...s })),
        Ready: [...src.Ready],

        Winner: src.Winner,
    };
}
