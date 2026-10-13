// A damped spring as a pure function of the frame number, so the same frame always looks the same
// (the player and the MP4 exporter must agree exactly).

/** 0 at frame <= 0, settles to 1 with a little overshoot. */
export function spring(frame: number, fps = 30, damping = 12, stiffness = 170): number {
  if (frame <= 0) return 0;
  const t = frame / fps;
  const omega = Math.sqrt(stiffness);
  const zeta = damping / (2 * omega);
  if (zeta >= 1) return 1 - Math.exp(-omega * t) * (1 + omega * t);
  const wd = omega * Math.sqrt(1 - zeta * zeta);
  return 1 - Math.exp(-zeta * omega * t) * (Math.cos(wd * t) + ((zeta * omega) / wd) * Math.sin(wd * t));
}
