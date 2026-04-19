
export interface Timestamp {
    Timestamp: number;   
    UpdateID: number;
}

export type GameState = Timestamp & {
  
    // extends the interface, just reminding myself, harmless but redundant
    UpdateID: number;
    Timestamp: number; 

    Phase: number;

    Cards: Card[];
    Deck: number[][];
    Hand: number[][];
    Field: number[][];
    Grave: number[][];

    Mana: number[];
    ActiveTriggers: TriggerEffect[];

};

export interface Card {
    CardID: number;
    DefNo: number;
    Team: number;
    Type: number;
    Zone: number; // 0: deck, 1: hand, 2: field, 3: grave
    Pending: boolean;
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

export function initGameState(): GameState {
    return {
        Timestamp: Date.now(),
        UpdateID: 0,
        Phase: 0,

        Cards: [],
        Deck: [[],[]],
        Hand: [[],[]],
        Field: [[],[]],
        Grave: [[],[]],

        Mana: [],
        ActiveTriggers: [],
    };
}

export function cloneGameState(src: GameState): GameState {
    return {
        Timestamp: src.Timestamp,
        UpdateID: src.UpdateID,
        Phase: src.Phase,

        Cards: src.Cards.map(card => ({ ...card })),

        Deck: src.Deck.map(teamDeck => [...teamDeck]),
        Hand: src.Hand.map(teamHand => [...teamHand]),
        Field: src.Field.map(teamField => [...teamField]),
        Grave: src.Grave.map(teamGrave => [...teamGrave]),

        Mana: [...src.Mana],

        ActiveTriggers: src.ActiveTriggers.map(trigger => ({
            ...trigger,
            Effect: { ...trigger.Effect },
        })),
    };
}