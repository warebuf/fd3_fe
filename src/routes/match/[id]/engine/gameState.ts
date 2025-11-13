
import { writable } from "svelte/store";

export type GameState = {
  // time the state is set for
  GameStateID: number;
  Timestamp: Date;   // ISO timestamp from Go's time.Time

  // state sets: array of unitIDs
  BenchUnits: number[];
  FieldUnits: number[];
  DeadUnits: number[];

  // team sets: index (unitID) -> team index
  Team: number[];

  // model set
  ModelNo: number[];

  // core unit stats
  HP: number[];

  // telemetry (index by unitID)
  TimesAttacked: number[];
  TimesDefended: number[];
  DamageDealt: number[];
  DamageReceived: number[];

  // counter
  NextUnitID: number;
};

export const game = writable<GameState | null>(null);