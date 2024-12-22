export let serve: (options: {
  fetch(
    request:
      | { method: 'GET'; url: URL }
      | { method: 'POST'; url: URL; body: FormData }
  ):
    | string
    | Promise<string>
    | { location: string }
    | Promise<{ location: string }>
  /**
   * Sets the root element selector.
   * The default value is `'body'`
   */
  root?: string
  /**
   * Enables page refresh on popstate.
   */
  refresh?: boolean
  /**
   * Enables stale-while-revalidating style caching.
   */
  cache?: boolean
  /**
   * Sets the caching storage.
   * The default value is `sessionStorage`
   */
  storage?: Storage
  /**
   * Called before page navigation.
   */
  before?(): void
  /**
   * Called after page navigation.
   */
  after?(): void
}) => { stop(): void }
