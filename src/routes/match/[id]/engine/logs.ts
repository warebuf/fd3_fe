import type { Timestamp, ChainStep } from "./gameState";

export type PhaseLogEntry    = Timestamp & { Type: 0; Phase: number; }
export type DrawExecEntry    = Timestamp & { Type: 1; TeamIndex: number; NumCards: number; }
export type DeclareCardEntry = Timestamp & { Type: 2; TeamIndex: number; CardIndex: number; }
export type SummonUnitEntry  = Timestamp & { Type: 3; TeamIndex: number; CardIndex: number; }
export type ScheduleChainLog = Timestamp & { Type: 4; ChainID: number; Step: ChainStep; }
export type RemoveChainLog      = Timestamp & { Type: 5; ChainID: number; }
export type DestroyCardEntry    = Timestamp & { Type: 6; TeamIndex: number; CardIndex: number; TargetAll: boolean; TargetTeamIndex: number; TargetCardIndex: number; }
export type GainManaEntry       = Timestamp & { Type: 7; TeamIndex: number; Amount: number; }

export type EventLog =
    | PhaseLogEntry
    | DrawExecEntry
    | DeclareCardEntry
    | SummonUnitEntry
    | ScheduleChainLog
    | RemoveChainLog
    | DestroyCardEntry
    | GainManaEntry;
