import type { Timestamp } from "./gameState";

export type PhaseLog              = Timestamp & { Type: 0;  Phase: number; }
export type DrawLog               = Timestamp & { Type: 1;  TeamIndex: number; NumCards: number; }
export type DeclareCardLog        = Timestamp & { Type: 2;  TeamIndex: number; CardIndex: number; }
export type SummonResolutionLog   = Timestamp & { Type: 3;  TeamIndex: number; CardIndex: number; }
export type AddChainLog           = Timestamp & { Type: 4;  StartAtActiveTime: number; ExecuteAtActiveTime: number; CardID: number; }
export type RemoveChainLog        = Timestamp & { Type: 5;  CardID: number; }
export type DestroyCardLog        = Timestamp & { Type: 6;  TeamIndex: number; CardIndex: number; TargetAll: boolean; TargetTeamIndex: number; TargetCardIndex: number; }
export type GainManaLog           = Timestamp & { Type: 7;  TeamIndex: number; Amount: number; }
export type SpendManaLog          = Timestamp & { Type: 8;  TeamIndex: number; Amount: number; }
export type AttackLog             = Timestamp & { Type: 9;  AttackerIndex: number; TargetIsUnit: boolean; TargetTeamIndex: number; TargetCardIndex: number; Damage: number; }
export type ReadyLog              = Timestamp & { Type: 10; TeamIndex: number; }
export type AutoSummonLog         = Timestamp & { Type: 11; TeamIndex: number; CardIndex: number; AutoSummonIdx: number; }
export type PauseLog              = Timestamp & { Type: 12; PausePhase: number; TeamIndex: number; TimeStart: number; TimeRemaining: number; }
export type UnpauseLog            = Timestamp & { Type: 13; TimeRemaining: number; }
export type AddAbilityTimerLog    = Timestamp & { Type: 14; CardIndex: number; AbilityID: number; AbilityIdx: number; TimerType: number; StartAtSimTime: number; ExecuteAtSimTime: number; }
export type ClearAbilityTimerLog  = Timestamp & { Type: 15; CardIndex: number; AbilityID: number; }

export type EventLog =
    | PhaseLog
    | DrawLog
    | DeclareCardLog
    | SummonResolutionLog
    | AddChainLog
    | RemoveChainLog
    | DestroyCardLog
    | GainManaLog
    | SpendManaLog
    | AttackLog
    | ReadyLog
    | AutoSummonLog
    | PauseLog
    | UnpauseLog
    | AddAbilityTimerLog
    | ClearAbilityTimerLog;
