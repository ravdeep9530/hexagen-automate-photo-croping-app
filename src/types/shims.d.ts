declare namespace JSX {
  interface IntrinsicElements {
    [elementName: string]: any;
  }
}

declare module "react" {
  export type HTMLAttributes<T = any> = Record<string, any>;
  export type ChangeEvent<T = any> = {
    target: T;
  };
  export type KeyboardEvent<T = any> = {
    key: string;
    preventDefault: () => void;
    currentTarget: T;
    nativeEvent: globalThis.KeyboardEvent;
  };
  export type DragEvent<T = any> = {
    currentTarget: T;
    dataTransfer: DataTransfer;
    preventDefault: () => void;
    stopPropagation: () => void;
  };

  export function useEffect(
    effect: () => void | (() => void),
    deps?: readonly unknown[],
  ): void;
  export function useId(): string;
  export function useMemo<T>(factory: () => T, deps: readonly unknown[]): T;
  export function useRef<T>(initialValue: T): { current: T };
  export function useState<T>(
    initialValue: T | (() => T),
  ): [T, (value: T | ((previous: T) => T)) => void];
  export function useSyncExternalStore<T>(
    subscribe: (listener: () => void) => () => void,
    getSnapshot: () => T,
    getServerSnapshot?: () => T,
  ): T;
  export function useCallback<T extends (...args: any[]) => any>(
    callback: T,
    deps: readonly unknown[],
  ): T;
}

declare module "react/jsx-runtime" {
  export const Fragment: any;
  export const jsx: any;
  export const jsxs: any;
}

declare module "lucide-react" {
  export const AlertCircle: any;
  export const CheckCircle2: any;
  export const Download: any;
  export const FileWarning: any;
  export const ImagePlus: any;
  export const ImageUpscale: any;
  export const Loader2: any;
  export const Move: any;
  export const Scissors: any;
  export const ScissorsOff: any;
  export const TriangleAlert: any;
  export const UploadCloud: any;
  export const XCircle: any;
}

declare module "react-easy-crop" {
  export interface Area {
    x: number;
    y: number;
    width: number;
    height: number;
  }

  const Cropper: any;
  export default Cropper;
}

declare module "framer-motion" {
  export const AnimatePresence: any;
  export const motion: {
    div: any;
  };
}

declare module "vitest" {
  export const afterEach: any;
  export const describe: any;
  export const expect: any;
  export const it: any;
}

declare module "node:fs" {
  export function readFileSync(path: string, encoding: string): string;
}
