import type { Timestamp, ChainStep } from "./gameState";

export type PhaseLog        = Timestamp & { Type: 0; Phase: number; }
export type DrawLog         = Timestamp & { Type: 1; TeamIndex: number; NumCards: number; }
export type DeclareCardLog  = Timestamp & { Type: 2; TeamIndex: number; CardIndex: number; }
export type SummonLog       = Timestamp & { Type: 3; TeamIndex: number; CardIndex: number; }
export type ScheduleChainLog = Timestamp & { Type: 4; ChainID: number; Step: ChainStep; }
export type RemoveChainLog  = Timestamp & { Type: 5; ChainID: number; }
export type DestroyCardLog  = Timestamp & { Type: 6; TeamIndex: number; CardIndex: number; TargetAll: boolean; TargetTeamIndex: number; TargetCardIndex: number; }
export type GainManaLog     = Timestamp & { Type: 7; TeamIndex: number; Amount: number; }
export type SpendManaLog    = Timestamp & { Type: 8; TeamIndex: number; Amount: number; }
export type AttackLog       = Timestamp & { Type: 9; AttackerIndex: number; TargetIsUnit: boolean; TargetTeamIndex: number; TargetCardIndex: number; Damage: number; }
export type ReadyLog        = Timestamp & { Type: 10; TeamIndex: number; }
export type AutoSummonLog   = Timestamp & { Type: 11; TeamIndex: number; CardIndex: number; AutoSummonIdx: number; }

export type EventLog =
    | PhaseLog
    | DrawLog
    | DeclareCardLog
    | SummonLog
    | ScheduleChainLog
    | RemoveChainLog
    | DestroyCardLog
    | GainManaLog
    | SpendManaLog
    | AttackLog
    | ReadyLog
    | AutoSummonLog;
