import "vitepress";

declare module "vitepress" {
  export interface PageData {
    versions?: {
      hash: string;
      timestamp: string;
    }[];
  }
}
