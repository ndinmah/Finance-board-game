# Ngrok–Colyseus development proxy design

## Problem

When the Vite development site is opened through an HTTPS ngrok URL, the
Colyseus client derives `wss://<ngrok-host>:2567`. The active ngrok tunnel only
forwards its public origin to Vite on port 5173, so requests to public port 2567
never reach the Colyseus server and room creation remains in the connecting
state.

## Design

Use the Vite development server as the single public entry point:

- The browser connects to the same origin that served the application.
- Vite proxies Colyseus matchmaking HTTP requests and WebSocket upgrades to
  `http://127.0.0.1:2567` during development.
- An explicit `VITE_WS_URL` continues to override automatic URL selection for
  deployments that use a dedicated game-server origin.
- Production behavior remains same-origin and unchanged.

This keeps the existing one-tunnel command (`ngrok http 5173`) and avoids
exposing the game-server port separately.

## Components and data flow

1. The room action creates a Colyseus client.
2. Without `VITE_WS_URL`, the client selects the page origin for both local and
   tunneled development.
3. The browser sends Colyseus HTTP/WebSocket traffic to Vite on port 5173.
4. Vite forwards that traffic to the Colyseus process on port 2567.

## Error handling

Existing Vietnamese connection-error mapping remains in place. No retry or UI
behavior changes are included in this fix.

## Testing

- Add a focused regression test for automatic endpoint selection: HTTPS ngrok
  pages must use the same secure origin rather than appending port 2567.
- Preserve coverage for an explicit `VITE_WS_URL` override if the endpoint
  selection is extracted into a testable helper.
- Run the client test suite, lint, and production build.
- Verify the Vite proxy accepts both HTTP matchmaking traffic and WebSocket
  upgrades, then manually create a room through the existing ngrok URL while
  both development processes are running.

## Scope

Only the Colyseus endpoint selection, Vite development proxy, and focused tests
are in scope. Existing PWA, map-data, and unrelated working-tree changes are not
modified.
