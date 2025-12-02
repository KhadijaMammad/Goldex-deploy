// Minimal stub types for the `phoenix` JS client.
// This prevents "Cannot find type definition file for 'phoenix'" errors.
// Replace with proper types or install `@types/phoenix` if/when available.

declare module 'phoenix' {
  // Common exports used by Phoenix JS client
  export class Socket {
    constructor(endpoint: string, opts?: any);
    connect(): void;
    disconnect(callback?: () => void): void;
    // allow arbitrary properties/methods
    [key: string]: any;
  }

  export class Presence {
    constructor(channel: any, opts?: any);
    // allow arbitrary properties/methods
    [key: string]: any;
  }

  const _default: any;
  export default _default;
}
