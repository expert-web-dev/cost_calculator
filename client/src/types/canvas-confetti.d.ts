declare module 'canvas-confetti' {
  export interface ConfettiOptions {
    particleCount?: number;
    angle?: number;
    spread?: number;
    startVelocity?: number;
    decay?: number;
    gravity?: number;
    drift?: number;
    ticks?: number;
    origin?: {
      x?: number;
      y?: number;
    };
    colors?: string[];
    shapes?: string[];
    scalar?: number;
    zIndex?: number;
    disableForReducedMotion?: boolean;
  }

  type ConfettiFunction = (options?: ConfettiOptions) => Promise<null>;

  interface CanvasConfettiModule extends ConfettiFunction {
    reset: () => void;
    create: (canvas: HTMLCanvasElement, options?: {resize?: boolean}) => ConfettiFunction;
  }

  const confetti: CanvasConfettiModule;
  export default confetti;
}