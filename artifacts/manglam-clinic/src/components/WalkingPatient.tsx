/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  WalkingPatient — someone walks in when you call the next token
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  A little figure strides in from the left, arrives, and the token number
 *  settles above it. Plays once per call, then holds still.
 *
 *  Drawn as inline SVG with the limbs animated, rather than an image, so it
 *  stays sharp on a waiting-room TV and costs nothing to load.
 *
 *  Silent when Lite mode or Windows' reduce-motion is on: the figure simply
 *  stands there.
 */

import { motion } from "framer-motion";
import { motionOff } from "@/components/AnimatedNumber";

export function WalkingPatient({
  trigger,
  size = 56,
  color = "#1152cc",
  className = "",
}: {
  /** change this to replay the walk — pass the token number */
  trigger: number | string;
  size?: number;
  color?: string;
  className?: string;
}) {
  const still = motionOff();

  // Four strides, then stop with the feet together.
  const swing = (from: number, to: number) => ({
    rotate: still ? 0 : [from, to, from, to, from, to, from, to, 0],
  });
  const stride = {
    duration: 1.15,
    times: [0, 0.12, 0.25, 0.37, 0.5, 0.62, 0.75, 0.87, 1],
    ease: "linear" as const,
  };

  return (
    <motion.div
      key={trigger}
      className={className}
      initial={still ? false : { x: -70, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={still ? { duration: 0 } : { duration: 1.15, ease: [0.22, 0.9, 0.3, 1] }}
      aria-hidden="true"
    >
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        {/* head */}
        <motion.circle
          cx="24" cy="9" r="5.5" fill={color}
          animate={still ? {} : { y: [0, -1.1, 0, -1.1, 0, -1.1, 0, -1.1, 0] }}
          transition={stride}
        />
        {/* body */}
        <motion.rect
          x="21" y="16" width="6" height="15" rx="3" fill={color}
          animate={still ? {} : { y: [0, -1.1, 0, -1.1, 0, -1.1, 0, -1.1, 0] }}
          transition={stride}
        />
        {/* arms */}
        <motion.rect
          x="22.2" y="17" width="3.6" height="12" rx="1.8" fill={color} opacity="0.75"
          style={{ originX: "24px", originY: "18px" }}
          animate={swing(28, -28)} transition={stride}
        />
        <motion.rect
          x="22.2" y="17" width="3.6" height="12" rx="1.8" fill={color} opacity="0.55"
          style={{ originX: "24px", originY: "18px" }}
          animate={swing(-28, 28)} transition={stride}
        />
        {/* legs */}
        <motion.rect
          x="22.2" y="30" width="3.6" height="14" rx="1.8" fill={color}
          style={{ originX: "24px", originY: "31px" }}
          animate={swing(-30, 30)} transition={stride}
        />
        <motion.rect
          x="22.2" y="30" width="3.6" height="14" rx="1.8" fill={color} opacity="0.65"
          style={{ originX: "24px", originY: "31px" }}
          animate={swing(30, -30)} transition={stride}
        />
        {/* the floor they arrive on */}
        <motion.ellipse
          cx="24" cy="45.5" rx="11" ry="1.6" fill={color} opacity="0.14"
          initial={still ? false : { scaleX: 0.4, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 0.14 }}
          transition={{ duration: 0.5, delay: still ? 0 : 0.9 }}
          style={{ originX: "24px" }}
        />
      </svg>
    </motion.div>
  );
}

export default WalkingPatient;
