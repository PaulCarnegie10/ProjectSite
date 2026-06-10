// Shared motion vocabulary — every section uses these so the whole
// site moves with one voice.

export const EASE = [0.22, 1, 0.36, 1];

export const VIEWPORT = { once: true, margin: '-15% 0px' };

export const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 1, ease: EASE } },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.9, ease: EASE } },
};

export const stagger = (staggerChildren = 0.1, delayChildren = 0.1) => ({
  hidden: {},
  visible: { transition: { staggerChildren, delayChildren } },
});
