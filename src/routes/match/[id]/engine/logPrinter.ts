import type { EventLog } from "./logs";
import { Phase } from "./gameState";

const PhaseNames = Object.fromEntries(Object.entries(Phase).map(([k, v]) => [v, k]));

const TimerTypeNames: Record<number, string> = { 0: "Normal", 1: "Summon" };

export function printLog(log: EventLog) {
    const t = log.WallTimestamp % 1_000_000;
    switch (log.Type) {
        case 0:  return console.log(`[Phase]           ${PhaseNames[log.Phase] ?? log.Phase}  @${t}`);
        case 1:  return console.log(`[Draw]            team=${log.TeamIndex}  cards=${log.NumCards}  @${t}`);
        case 2:  return console.log(`[DeclareCard]     team=${log.TeamIndex}  card=${log.CardIndex}  @${t}`);
        case 3:  return console.log(`[SummonResolve]   team=${log.TeamIndex}  card=${log.CardIndex}  @${t}`);
        case 4:  return console.log(`[AddChain]        cardID=${log.CardID}  start=${log.StartAtActiveTime}  exec=${log.ExecuteAtActiveTime}  @${t}`);
        case 5:  return console.log(`[RemoveChain]     cardID=${log.CardID}  @${t}`);
        case 6:  return console.log(`[DestroyCard]     team=${log.TeamIndex}  card=${log.CardIndex}  targetAll=${log.TargetAll}  targetTeam=${log.TargetTeamIndex}  targetCard=${log.TargetCardIndex}  @${t}`);
        case 7:  return console.log(`[GainMana]        team=${log.TeamIndex}  amount=${log.Amount}  @${t}`);
        case 8:  return console.log(`[SpendMana]       team=${log.TeamIndex}  amount=${log.Amount}  @${t}`);
        case 9:  return console.log(`[Attack]          attacker=${log.AttackerIndex}  targetIsUnit=${log.TargetIsUnit}  targetTeam=${log.TargetTeamIndex}  targetCard=${log.TargetCardIndex}  damage=${log.Damage}  @${t}`);
        case 10: return console.log(`[Ready]           team=${log.TeamIndex}  @${t}`);
        case 11: return console.log(`[AutoSummon]      team=${log.TeamIndex}  card=${log.CardIndex}  idx=${log.AutoSummonIdx}  @${t}`);
        case 12: return console.log(`[Pause]           team=${log.TeamIndex}  timeRemaining=${log.TimeRemaining}  @${t}`);
        case 13: return console.log(`[Unpause]         team=${log.TeamIndex}  timeRemaining=${log.TimeRemaining}  @${t}`);
        case 14: return console.log(`[AddAbilityTimer] card=${log.CardIndex}  abilityID=${log.AbilityID}  abilityIdx=${log.AbilityIdx}  type=${TimerTypeNames[log.TimerType] ?? log.TimerType}  start=${log.StartAtSimTime}  exec=${log.ExecuteAtSimTime}  @${t}`);
        case 15: return console.log(`[ClearAbilityTimer] card=${log.CardIndex}  abilityID=${log.AbilityID}  @${t}`);
    }
}
