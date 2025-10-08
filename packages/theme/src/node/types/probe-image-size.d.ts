declare module "probe-image-size" {
  export interface ProbeResult {
    width: number;
    height: number;
    type: string;
    mime: string;
    wUnits?: string;
    hUnits?: string;
    length?: number;
    url?: string;
    orientation?: number;
  }

  export interface ProbeOptions {
    timeout?: number;
    retries?: number;
    open_timeout?: number;
    response_timeout?: number;
  }

  function probe(
    input: string | NodeJS.ReadableStream,
    options?: ProbeOptions,
  ): Promise<ProbeResult>;

  export default probe;
}
