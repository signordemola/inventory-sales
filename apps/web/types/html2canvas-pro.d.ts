declare module "html2canvas-pro" {
  import { Options } from "html2canvas";

  function html2canvas(
    element: HTMLElement,
    options?: Partial<Options>,
  ): Promise<HTMLCanvasElement>;

  export default html2canvas;
}
