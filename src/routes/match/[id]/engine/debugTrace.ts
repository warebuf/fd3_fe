import type { GameState } from "./gameState";
import { cloneGameState } from "./gameState";
import type { EventLog } from "./logs";

export const DEBUG_TRACE = true;

type TraceEntry = {
    log: EventLog;
    state: GameState;
};

const entries: TraceEntry[] = [];

export function recordTrace(log: EventLog, state: GameState) {
    if (!DEBUG_TRACE) return;
    entries.push({ log, state: cloneGameState(state) });
}

export function downloadTrace() {
    const jsonl = entries.map(e => JSON.stringify(e)).join('\n');
    const blob = new Blob([jsonl], { type: 'application/jsonl' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trace_${Date.now()}.jsonl`;
    a.click();
    URL.revokeObjectURL(url);
}

// call downloadTrace() from the browser console
if (DEBUG_TRACE && typeof window !== 'undefined') {
    (window as any).downloadTrace = downloadTrace;
}
