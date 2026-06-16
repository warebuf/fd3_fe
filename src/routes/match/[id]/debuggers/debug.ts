let content = '';

export function debugDump(str: string) {
    content += str + '\n';
}

export function initDebugDownload() {
    function onKeyDown(e: KeyboardEvent) {
        if (e.key !== 'd' && e.key !== 'D') return;
        if (!content) return;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'debug.txt';
        a.click();
        URL.revokeObjectURL(url);
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
}
