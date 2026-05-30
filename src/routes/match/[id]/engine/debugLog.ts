const buffer: string[] = [];

export function dlog(msg: string) {
    buffer.push(msg);
}

export function downloadLogs() {
    const blob = new Blob([buffer.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'debug.txt';
    a.click();
    URL.revokeObjectURL(url);
}
