
export interface Timestamp {
    Timestamp: number;   
    GameStateID: number;
}

export type GameState = Timestamp & {
  
    // extends the interface, just reminding myself, harmless but redundant
    GameStateID: number;
    Timestamp: number; 

    Phase: number;

    Cards: Card[];
    Deck: number[][];
    Hand: number[][];
    Field: number[][];
    Grave: number[][];

    Permanents: Permanent[];
    Mana: number[];
    ActiveTriggers: TriggerEffect[];

};

export interface Card {
    CardID: number;
    DefNo: number;
    Team: number;
    Type: number;
    Zone: number; // 0: deck, 1: hand, 2: field, 3: grave
    Armed: boolean;
}

export interface Effect {
    Type: number;
    A: number;
    B: number;
    C: number;
}
  
export interface TriggerEffect {
    Condition: number;
    Effect: Effect;
}
  
export interface Permanent {
    PermanentID: number;
    SourceCard: number;
    Type: number;
    HP: number;
    Team: number;
    Master: boolean;
}

export function initGameState(): GameState {
    return {
        Timestamp: Date.now(),
        GameStateID: 0,
        Phase: 0,

        Cards: [],
        Deck: [],
        Hand: [],
        Field: [],
        Grave: [],

        Permanents: [],
        Mana: [],
        ActiveTriggers: [],
    };
}

export function cloneGameState(src: GameState): GameState {
    return {
        Timestamp: src.Timestamp,
        GameStateID: src.GameStateID,
        Phase: src.Phase,

        Cards: src.Cards.map(card => ({ ...card })),

        Deck: src.Deck.map(teamDeck => [...teamDeck]),
        Hand: src.Hand.map(teamHand => [...teamHand]),
        Field: src.Field.map(teamField => [...teamField]),
        Grave: src.Grave.map(teamGrave => [...teamGrave]),

        Permanents: src.Permanents.map(permanent => ({ ...permanent })),

        Mana: [...src.Mana],

        ActiveTriggers: src.ActiveTriggers.map(trigger => ({
            ...trigger,
            Effect: { ...trigger.Effect },
        })),
    };
}