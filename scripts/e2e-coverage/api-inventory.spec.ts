import {
  mkdirSync, mkdtempSync, rmSync, writeFileSync,
} from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { scanApiUsage } from './api-inventory';

const api = `
  declare const api: {
    call(method: string, ...args: unknown[]): void;
    query(method: string): void;
    job(method: string, args?: unknown[]): void;
    subscribe(event: string): void;
  };
  declare const flag: boolean;
  declare const ns: string;
`;

const fixtures: Record<string, string> = {
  'plain.ts': `${api}
    api.call('a.b');
    api.call('core.ping');
  `,
  'comment.ts': `${api}
    /**
     * Usage: api.call('x.y'), or { method: 'x.z' }.
     */
    // api.subscribe('x.event');
    export const nothing = 1;
  `,
  'parameter-type.ts': `${api}
    export function handle(method: 'c.d' | 'e.f'): string {
      return method;
    }
  `,
  'conditional-const.ts': `${api}
    const holdOrRelease = flag ? 'g.h' : 'i.j';
    api.call(holdOrRelease);
  `,
  'literal-union-parameter.ts': `${api}
    export function load(endPoint: 'o.p' | 'q.r'): void {
      api.query(endPoint);
    }
  `,
  'loosely-typed.ts': `${api}
    type QueryMethod = 'u.v' | 'w.x';
    export function forward(method: QueryMethod): void {
      api.query(method);
    }
    declare const configured: QueryMethod;
    const copied = configured;
    api.call(copied);
    api.call(flag ? configured : 'y.z');
  `,
  'method-property.ts': `${api}
    export const download = { method: 'k.l', args: [] };
  `,
  'bulk.ts': `${api}
    api.job('core.bulk', ['m.n', []]);
  `,
  'runtime.ts': `${api}
    api.call(\`\${ns}.query\`);
  `,
  'events.ts': `${api}
    api.subscribe('s.t');
  `,
  'plain.spec.ts': `${api}
    api.call('spec.only');
  `,
  'core/testing/mock.ts': `${api}
    api.call('testing.only');
  `,
};

describe('scanApiUsage', () => {
  let root: string;

  beforeAll(() => {
    root = mkdtempSync(join(tmpdir(), 'api-inventory-'));
    for (const [path, source] of Object.entries(fixtures)) {
      mkdirSync(join(root, path, '..'), { recursive: true });
      writeFileSync(join(root, path), source);
    }
  });

  afterAll(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('finds the methods named at call sites, and none from comments, types or runtime names', () => {
    const { methods } = scanApiUsage(root);

    expect([...methods].sort((a, b) => a.localeCompare(b))).toEqual([
      'a.b',
      'core.bulk',
      'g.h',
      'i.j',
      'k.l',
      'm.n',
      'o.p',
      'q.r',
    ]);
  });

  it('finds subscribed events, and none from comments', () => {
    const { events } = scanApiUsage(root);

    expect([...events]).toEqual(['s.t']);
  });
});
