#!/usr/bin/env tsx

import { readFileSync } from 'fs';
import { join } from 'path';
import { createTrueNasClient, type AuthResponse } from '@truenas/api-client';
import {
  filter, firstValueFrom, take, timeout,
} from 'rxjs';

interface AuthCredentials {
  username?: string;
  password?: string;
}

const defaultCredentials: AuthCredentials = {
  username: process.env.AUTH_USERNAME || 'root',
  password: process.env.AUTH_PASSWORD || 'testing',
};

const connectTimeoutMs = 30_000;
const loginTimeoutMs = 30_000;

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

/**
 * Signs in over `@truenas/api-client` and returns the `reconnect_token` login mints, which the `?token=` URL
 * param spends via `auth.login_ex` (`TOKEN_PLAIN`); it outlives this session. Plain `ws://`, as the dev
 * server's page connects, which also sidesteps self-signed certs. No version pinned: every version from
 * v27.0.0 mints the same token, so UI version bumps don't touch this file.
 */
async function generateDevToken(credentials: AuthCredentials = {}): Promise<string> {
  const creds = { ...defaultCredentials, ...credentials };
  const { remote } = getEnvironment();

  const client = await createTrueNasClient({
    uuid: 'webui-auth-url',
    hostnames: [remote],
    enabled: true,
    protocol: 'http:',
  });

  try {
    await firstValueFrom(
      client.connection.opened.pipe(filter(Boolean), take(1), timeout(connectTimeoutMs)),
    );

    const auth: AuthResponse = await firstValueFrom(
      client.authenticator
        .loginWithUserPass(creds.username || '', creds.password || '')
        .pipe(timeout(loginTimeoutMs)),
    );

    // The client only throws on AUTH_ERR; OTP_REQUIRED and the like resolve.
    if (String(auth.response_type) !== 'SUCCESS') {
      throw new Error(`Login did not succeed: ${String(auth.response_type)}`);
    }

    if (auth.reconnect_token) {
      return auth.reconnect_token;
    }

    throw new Error('Login response did not contain a reconnect token');
  } finally {
    client.close();
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
