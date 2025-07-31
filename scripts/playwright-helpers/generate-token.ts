#!/usr/bin/env tsx

import { readFileSync } from 'fs';
import { join } from 'path';
import WebSocket from 'ws';

interface AuthCredentials {
  username?: string;
  password?: string;
  tokenTtl?: number;
}

interface WebSocketResponse {
  id: string;
  result?: string;
  error?: { message: string };
}

const defaultCredentials: AuthCredentials = {
  username: 'root',
  password: 'testing',
  tokenTtl: 7200,
};

// Read environment from file
function getEnvironment(): { remote: string; port: number } {
  const envPath = join(process.cwd(), 'src/environments/environment.ts');
  const envContent = readFileSync(envPath, 'utf8');

  const remoteMatch = /remote:\s*'([^']+)'/.exec(envContent);
  const portMatch = /port:\s*(\d+)/.exec(envContent);

  return {
    remote: remoteMatch?.[1] || 'localhost',
    port: portMatch ? parseInt(portMatch[1], 10) : 4200,
  };
}

async function createWebSocketConnection(url: string): Promise<WebSocket> {
  const { default: webSocketConstructor } = await import('ws');
  // eslint-disable-next-line new-cap
  return new webSocketConstructor(url);
}

async function waitForWebSocketOpen(ws: WebSocket): Promise<void> {
  return new Promise((resolve, reject) => {
    if (ws.readyState === WebSocket.OPEN) {
      resolve();
      return;
    }

    ws.onopen = () => resolve();
    ws.onerror = () => reject(new Error('WebSocket connection failed'));
  });
}

function sendWebSocketMessage(ws: WebSocket, message: object): void {
  ws.send(JSON.stringify(message));
}

async function waitForWebSocketMessage(ws: WebSocket, expectedId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    ws.onmessage = (event) => {
      try {
        const response = JSON.parse(event.data.toString()) as WebSocketResponse;

        if (response.id === expectedId) {
          if (response.result) {
            resolve(response.result);
          } else {
            reject(new Error(`Request failed: ${response.error?.message || 'Unknown error'}`));
          }
        }

        if (response.error) {
          reject(new Error(`WebSocket error: ${response.error.message}`));
        }
      } catch {
        reject(new Error('Failed to parse WebSocket response'));
      }
    };

    ws.onerror = () => reject(new Error('WebSocket connection failed'));
  });
}

async function generateDevToken(credentials: AuthCredentials = {}): Promise<string> {
  const creds = { ...defaultCredentials, ...credentials };
  const { remote } = getEnvironment();

  const wsUrl = `ws://${remote}/api/current`;
  const ws = await createWebSocketConnection(wsUrl);

  try {
    // Wait for connection to open
    await waitForWebSocketOpen(ws);

    // Send login request
    sendWebSocketMessage(ws, {
      jsonrpc: '2.0',
      id: 'dev-login',
      method: 'auth.login_ex',
      params: [{
        mechanism: 'PASSWORD_PLAIN',
        username: creds.username,
        password: creds.password,
      }],
    });

    // Wait for login response
    await waitForWebSocketMessage(ws, 'dev-login');

    // Send token generation request
    sendWebSocketMessage(ws, {
      jsonrpc: '2.0',
      id: 'dev-token',
      method: 'auth.generate_token',
      params: [creds.tokenTtl, {}, false, false],
    });

    // Wait for token response
    return await waitForWebSocketMessage(ws, 'dev-token');
  } finally {
    ws.close();
  }
}

// CLI usage
async function main(): Promise<void> {
  const targetUrl = process.argv[2] || '/';
  const { port } = getEnvironment();

  try {
    const token = await generateDevToken();
    const baseUrl = `http://localhost:${port}`;
    const urlWithToken = `${baseUrl}${targetUrl}?token=${token}`;
    // eslint-disable-next-line no-console
    console.log(urlWithToken);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error:', message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}

export { generateDevToken };
