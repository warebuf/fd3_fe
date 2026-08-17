import type { Timestamp, Effect } from "./gameState";

export type PhaseLog              = Timestamp & { Type: 0;  Phase: number; PhaseEndInActiveTime: number; }
export type DrawLog               = Timestamp & { Type: 1;  TeamIndex: number; NumCards: number; }
export type DeclareCardLog        = Timestamp & { Type: 2;  TeamIndex: number; CardIndex: number; }
export type SummonResolutionLog   = Timestamp & { Type: 3;  TeamIndex: number; CardIndex: number; }
export type AddChainLog           = Timestamp & { Type: 4;  ChainType: number; CardIndex: number; ActiveIndex: number; TeamIndex: number; StartAtActiveTime: number; PopAtActiveTime: number; ExecuteAtActiveTime: number; Effects: Effect[]; }
export type RemoveChainLog        = Timestamp & { Type: 5;  CardIndex: number; }
export type DestroyCardLog        = Timestamp & { Type: 6;  TargetAll: boolean; TargetTeamIndex: number; TargetCardIndex: number; }
export type GainManaLog           = Timestamp & { Type: 7;  TeamIndex: number; Amount: number; }
export type SpendManaLog          = Timestamp & { Type: 8;  TeamIndex: number; Amount: number; }
export type AttackLog             = Timestamp & { Type: 9;  AttackerIndex: number; TargetTeamIndex: number; TargetCardIndex: number; Damage: number; }
export type HealLog               = Timestamp & { Type: 10; HealerIndex: number; TargetCardIndex: number; Amount: number; }
export type ReadyLog              = Timestamp & { Type: 11; TeamIndex: number; }
export type UnreadyLog            = Timestamp & { Type: 12; TeamIndex: number; }
export type AutoSummonLog         = Timestamp & { Type: 13; TeamIndex: number; CardIndex: number; AutoSummonPriority: number; }
export type PauseLog              = Timestamp & { Type: 14; PausePhase: number; TeamIndex: number; TimeStart: number; TimeRemaining: number; }
export type UnpauseLog            = Timestamp & { Type: 15; TimeRemaining: number; }
export type AddTickAbilityLog     = Timestamp & { Type: 16; CardIndex: number; AbilityIndex: number; Condition: number; StartAtSimTime: number; ExecuteAtSimTime: number; }
export type ClearTickAbilityLog   = Timestamp & { Type: 17; CardIndex: number; AbilityIndex: number; }
export type GameOverLog           = Timestamp & { Type: 18; Winner: number; }
export type CounterChainLog       = Timestamp & { Type: 19; SourceCardIndex: number; TargetCardIndex: number; }
export type RefreshChainLog       = Timestamp & { Type: 20; CardIndex: number; StartAtActiveTime: number; PopAtActiveTime: number; ExecuteAtActiveTime: number; }
export type PlayContinuousLog     = Timestamp & { Type: 21; TeamIndex: number; CardIndex: number; }
export type RemoveContinuousLog   = Timestamp & { Type: 22; TeamIndex: number; CardIndex: number; }
export type RemoveChargeLog       = Timestamp & { Type: 23; TeamIndex: number; CardIndex: number; ChargesRemaining: number; }
export type AddChargeLog          = Timestamp & { Type: 24; TeamIndex: number; CardIndex: number; Charges: number; }
export type PreselectLog          = Timestamp & { Type: 25; TeamIndex: number; CardIndex: number; AbilityIndex: number; TargetCardIndex: number; }
export type ToggleAutoAbilityLog  = Timestamp & { Type: 26; TeamIndex: number; CardIndex: number; AbilityIndex: number; On: boolean; }
export type ConsumeLog            = Timestamp & { Type: 27; SourceCardIndex: number; TargetCardIndex: number; AbilityIndex: number; Bonus: number; }
export type SpawnTokenLog         = Timestamp & { Type: 28; TeamIndex: number; CardIndex: number; DefNo: number; Name: string; Description: string; HP: number; Cost: number; Archetype: number; CardType: number; IsToken: boolean; ChainEntry: number; }
export type ToggleStructureAutoAbilityLog = Timestamp & { Type: 29; TeamIndex: number; On: boolean; }
export type SetTrapLog            = Timestamp & { Type: 30; TeamIndex: number; CardIndex: number; SetStartAtSimTime: number; ReadyAtSimTime: number; }
export type TrapReadyLog          = Timestamp & { Type: 31; TeamIndex: number; CardIndex: number; }

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
    | HealLog
    | ReadyLog
    | UnreadyLog
    | AutoSummonLog
    | PauseLog
    | UnpauseLog
    | AddTickAbilityLog
    | ClearTickAbilityLog
    | GameOverLog
    | CounterChainLog
    | RefreshChainLog
    | PlayContinuousLog
    | RemoveContinuousLog
    | RemoveChargeLog
    | AddChargeLog
    | PreselectLog
    | ToggleAutoAbilityLog
    | ConsumeLog
    | SpawnTokenLog
    | ToggleStructureAutoAbilityLog
    | SetTrapLog
    | TrapReadyLog;
