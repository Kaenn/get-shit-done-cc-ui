import { open } from '@tauri-apps/plugin-shell';

export function Attribution() {
  const handleClick = async () => {
    try {
      await open('https://github.com/winfunc/opcode');
    } catch (error) {
      console.error('Failed to open OPCode repository:', error);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 h-6 z-50 bg-background border-t border-border/40 flex items-center justify-end px-3">
      <button
        onClick={handleClick}
        className="text-xs text-muted-foreground/60 hover:text-cyan-500 transition-colors duration-200 cursor-pointer"
        aria-label="View OPCode project on GitHub"
      >
        Built on OPCode
      </button>
    </div>
  );
}
