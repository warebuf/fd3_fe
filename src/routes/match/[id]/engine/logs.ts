import type { Timestamp, Effect } from "./gameState";

export type PhaseLog              = Timestamp & { Type: 0;  Phase: number; PhaseEndInActiveTime: number; }
export type DrawLog               = Timestamp & { Type: 1;  TeamIndex: number; NumCards: number; }
export type DeclareCardLog        = Timestamp & { Type: 2;  TeamIndex: number; CardIndex: number; }
export type SummonResolutionLog   = Timestamp & { Type: 3;  TeamIndex: number; CardIndex: number; }
export type AddStackLog           = Timestamp & { Type: 4;  StackType: number; CardID: number; StartAtActiveTime: number; PopAtActiveTime: number; ExecuteAtActiveTime: number; Effects: Effect[]; }
export type RemoveStackLog        = Timestamp & { Type: 5;  CardID: number; }
export type DestroyCardLog        = Timestamp & { Type: 6;  TeamIndex: number; CardIndex: number; TargetAll: boolean; TargetTeamIndex: number; TargetCardIndex: number; }
export type GainManaLog           = Timestamp & { Type: 7;  TeamIndex: number; Amount: number; }
export type SpendManaLog          = Timestamp & { Type: 8;  TeamIndex: number; Amount: number; }
export type AttackLog             = Timestamp & { Type: 9;  AttackerIndex: number; TargetIsUnit: boolean; TargetTeamIndex: number; TargetCardIndex: number; Damage: number; }
export type HealLog               = Timestamp & { Type: 10; HealerIndex: number; TargetCardIndex: number; Amount: number; }
export type ReadyLog              = Timestamp & { Type: 11; TeamIndex: number; }
export type UnreadyLog            = Timestamp & { Type: 12; TeamIndex: number; }
export type StageLog              = Timestamp & { Type: 13; TeamIndex: number; CardIndex: number; StageOrder: number; }
export type AutoSummonLog         = Timestamp & { Type: 14; TeamIndex: number; CardIndex: number; AutoSummonIdx: number; }
export type PauseLog              = Timestamp & { Type: 15; PausePhase: number; TeamIndex: number; TimeStart: number; TimeRemaining: number; }
export type UnpauseLog            = Timestamp & { Type: 16; TimeRemaining: number; }
export type AddAbilityTimerLog    = Timestamp & { Type: 17; CardIndex: number; AbilityID: number; AbilityIdx: number; TimerType: number; StartAtSimTime: number; ExecuteAtSimTime: number; }
export type ClearAbilityTimerLog  = Timestamp & { Type: 18; CardIndex: number; AbilityID: number; }
export type GameOverLog           = Timestamp & { Type: 19; Winner: number; }
export type CounterStackLog       = Timestamp & { Type: 20; SourceCardID: number; TargetCardID: number; }
export type RefreshStackLog       = Timestamp & { Type: 21; CardID: number; StartAtActiveTime: number; PopAtActiveTime: number; ExecuteAtActiveTime: number; }
export type PlayContinuousLog     = Timestamp & { Type: 22; TeamIndex: number; CardID: number; Charges: number; }
export type RemoveContinuousLog   = Timestamp & { Type: 23; TeamIndex: number; CardID: number; }
export type RemoveChargeLog       = Timestamp & { Type: 24; TeamIndex: number; CardID: number; ChargesRemaining: number; }
export type AddChargeLog          = Timestamp & { Type: 25; TeamIndex: number; CardID: number; Charges: number; }
export type PreselectLog          = Timestamp & { Type: 26; TeamIndex: number; CardID: number; TargetCardIndex: number; }

export type EventLog =
    | PhaseLog
    | DrawLog
    | DeclareCardLog
    | SummonResolutionLog
    | AddStackLog
    | RemoveStackLog
    | DestroyCardLog
    | GainManaLog
    | SpendManaLog
    | AttackLog
    | HealLog
    | ReadyLog
    | UnreadyLog
    | StageLog
    | AutoSummonLog
    | PauseLog
    | UnpauseLog
    | AddAbilityTimerLog
    | ClearAbilityTimerLog
    | GameOverLog
    | CounterStackLog
    | RefreshStackLog
    | PlayContinuousLog
    | RemoveContinuousLog
    | RemoveChargeLog
    | AddChargeLog
    | PreselectLog;
