export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

export function lerpVec3(start: [number, number, number], end: [number, number, number], t: number): [number, number, number] {
  return [
    lerp(start[0], end[0], t),
    lerp(start[1], end[1], t),
    lerp(start[2], end[2], t),
  ];
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function easeInOutQuart(t: number): number {
  return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
}

export function spring(value: number, target: number, velocity: number, stiffness = 170, damping = 26): { value: number; velocity: number } {
  const force = -stiffness * (value - target);
  const damper = -damping * velocity;
  const acceleration = force + damper;
  const newVelocity = velocity + acceleration * 0.016;
  const newValue = value + newVelocity * 0.016;
  return { value: newValue, velocity: newVelocity };
}

export function createTransitionTimer(duration: number): { elapsed: number; progress: number; done: boolean; update: (dt: number) => void } {
  let elapsed = 0;
  return {
    get elapsed() { return elapsed; },
    get progress() { return Math.min(elapsed / duration, 1); },
    get done() { return elapsed >= duration; },
    update(dt: number) { elapsed = Math.min(elapsed + dt, duration); },
  };
}