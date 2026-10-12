"use client";

import { useState } from "react";

/**
 * Local state seeded from server-rendered props that resets whenever the server
 * sends fresh data (after a Server Action refreshes the page). Lets editors
 * update the list right away and still end up showing what the backend saved.
 */
export function useServerState(initial) {
  const [state, setState] = useState(initial);
  const [prev, setPrev] = useState(initial);
  if (initial !== prev) {
    setPrev(initial);
    setState(initial);
  }
  return [state, setState];
}
