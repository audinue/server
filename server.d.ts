export type GetRequest = {
  method: "GET";
  url: URL;
};

export type PostRequest = {
  method: "POST";
  url: URL;
  body: FormData;
};

export type Request = GetRequest | PostRequest;

export type Redirection = { location: string };

export type Response = string | Redirection;

export type ServeOption = {
  fetch(request: Request): Response | Promise<Response>;
  root?: string;
  refresh?: boolean;
  cache?: boolean;
  storage?: Storage;
  navigating?(): void;
  navigated?(): void;
};

export type Server = {
  dispose(): void;
  push(url: string): void;
  replace(url: string): void;
  reload(): void;
  fetch(
    url: string,
    options?: { method?: "GET" | "POST"; body?: FormData }
  ): Promise<string>;
};

export type Serve = (options: ServeOption) => Server;

export let serve: Serve;
