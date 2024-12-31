export type Request = {
  method: "GET" | "POST";
  url: URL;
  body: FormData;
};

export type Redirect = { location: string };

export type Response = string | Redirect;

export type CacheConfig = {
  enabled?: boolean;
  key?: string;
  storage?: Storage;
};

export type ServeConfig = {
  fetch(request: Request): Response | Promise<Response>;
  root?: string;
  reload?: boolean;
  cache?: CacheConfig;
  navigating?(): void;
  navigated?(): void;
};

export type FetchConfig = { method?: "GET" | "POST"; body?: FormData };

export type Server = {
  dispose(): void;
  push(url: string): void;
  replace(url: string): void;
  reload(): void;
  fetch(url: string, config?: FetchConfig): Promise<string>;
};

export type Serve = (config: ServeConfig) => Server;

export const serve: Serve;
