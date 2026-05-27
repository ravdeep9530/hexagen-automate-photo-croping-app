declare module '@imgly/background-removal' {
  export interface Config {
    publicPath?: string;
    progress?: (key: string, current: number, total: number) => void;
    debug?: boolean;
  }

  export function removeBackground(image: Blob | File | ImageData | HTMLImageElement | HTMLCanvasElement, config?: Config): Promise<Blob>;

  const defaultExport: {
    removeBackground?: typeof removeBackground;
  } | typeof removeBackground;

  export default defaultExport;
}
