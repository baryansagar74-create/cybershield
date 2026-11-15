/**
 * ProfileGuard Motion Presets
 * Motion exists to show what changed, not to decorate.
 */

export const motionPresets = {
  instant: {
    duration: 0.09,
    ease: "linear",
  },
  quick: {
    duration: 0.16,
    ease: [0.2, 0, 0, 1],
  },
  standard: {
    duration: 0.24,
    ease: [0.2, 0, 0, 1],
  },
  emphasis: {
    duration: 0.36,
    ease: [0.3, 0, 0, 1],
  },
  springDial: {
    type: "spring",
    stiffness: 140,
    damping: 14,
  },
} as const;

export const reducedMotionTransition = {
  duration: 0.001,
  ease: "linear",
};
