import { AnimatePresence, motion } from "framer-motion";
import type { CSSProperties } from "react";

/**
 * StartupIntro - a lightweight startup overlay shown on app launch.
 * - Non-interactive; auto-fades after parent hides it via the `visible` prop.
 * - Displays "GSD-UI" text branding with loading indicator.
 */
export function StartupIntro({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-background"
          aria-hidden="true"
        >
          {/* Ambient radial glow - cyan hue */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
            style={{
              background:
                "radial-gradient(800px circle at 50% 55%, var(--color-cyan)/12, transparent 65%)",
              pointerEvents: "none",
            } as CSSProperties}
          />

          {/* Subtle vignette */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(1200px circle at 50% 40%, transparent 60%, rgba(0,0,0,0.25))",
            }}
          />

          {/* Content */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
            className="relative flex flex-col items-center justify-center gap-6"
          >
            {/* GSD-UI Text Logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
              className="font-mono text-6xl font-extrabold tracking-tight"
              style={{ color: 'var(--color-cyan-bright)' }}
            >
              GSD-UI
            </motion.div>

            {/* Loading dots */}
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: 'var(--color-cyan-bright)' }}
                  initial={{ opacity: 0.3 }}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default StartupIntro;
