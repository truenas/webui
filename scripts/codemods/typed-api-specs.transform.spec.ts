import { transformSpec } from './typed-api-specs.transform';

function lines(...source: string[]): string {
  return `${source.join('\n')}\n`;
}

describe('transformSpec', () => {
  it('moves a whole spec onto the typed double', () => {
    const source = lines(
      "import { createComponentFactory } from '@ngneat/spectator/jest';",
      "import { mockCall, mockJob, mockApi } from 'app/core/testing/utils/mock-api.utils';",
      "import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';",
      "import { Pool } from 'app/interfaces/pool.interface';",
      "import { ApiService } from 'app/modules/websocket/api.service';",
      '',
      'const createComponent = createComponentFactory({',
      '  providers: [',
      '    mockApi([',
      "      mockCall('pool.query', [{ id: 1 }] as Pool[]),",
      "      mockCall('user.query'),",
      "      mockCall('pool.update'),",
      "      mockCall('system.info', { version: 'x' }),",
      "      mockJob('pool.export'),",
      "      mockJob('pool.scrub', fakeSuccessfulJob(true, [1])),",
      '    ]),',
      '  ],',
      '});',
      '',
      'it("saves", () => {',
      '  const api: ApiService = spectator.inject(ApiService);',
      "  expect(api.call).toHaveBeenCalledWith('pool.update', [1, { name: 'x' }]);",
      "  expect(api.call).toHaveBeenCalledWith('pool.query', [[['id', '=', 1]], { get: true }]);",
      "  expect(api.call).toHaveBeenCalledWith('user.query', [[], { count: true }]);",
      "  expect(spectator.inject(ApiService).call).not.toHaveBeenCalledWith('user.query');",
      "  expect(api.call).toHaveBeenNthCalledWith(2, 'pool.query', [[], { select: ['id'] }]);",
      "  expect(api.call).toHaveBeenCalledWith('user.query', [[], {",
      '    get: true,',
      "    select: ['id'],",
      '  }]);',
      '});',
    );

    const { output, notes } = transformSpec(source, 'x.spec.ts');

    expect(notes).toEqual([]);
    expect(output).toBe(lines(
      "import { createComponentFactory } from '@ngneat/spectator/jest';",
      "import { mockTypedApi, mockTypedCall, mockTypedJob, mockTypedQuery } from 'app/core/testing/utils/mock-typed-api.utils';",
      "import { JobState } from 'app/enums/job-state.enum';",
      "import { Pool } from 'app/interfaces/pool.interface';",
      "import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';",
      '',
      'const createComponent = createComponentFactory({',
      '  providers: [',
      '    mockTypedApi([',
      "      mockTypedQuery('pool.query', [{ id: 1 }] as Pool[]),",
      "      mockTypedQuery('user.query', []),",
      "      mockTypedCall('pool.update', null),",
      "      mockTypedCall('system.info', { version: 'x' }),",
      "      mockTypedJob('pool.export', { state: JobState.Success }),",
      "      mockTypedJob('pool.scrub', { state: JobState.Success, result: true, arguments: [1] }),",
      '    ]),',
      '  ],',
      '});',
      '',
      'it("saves", () => {',
      '  const api: TypedApiService = spectator.inject(TypedApiService);',
      "  expect(api.call).toHaveBeenCalledWith('pool.update', [1, { name: 'x' }]);",
      "  expect(api.queryOne).toHaveBeenCalledWith('pool.query', [['id', '=', 1]]);",
      "  expect(api.queryCount).toHaveBeenCalledWith('user.query', []);",
      "  expect(spectator.inject(TypedApiService).query).not.toHaveBeenCalledWith('user.query');",
      "  expect(api.query).toHaveBeenNthCalledWith(2, 'pool.query', [], { select: ['id'] });",
      "  expect(api.queryOne).toHaveBeenCalledWith('user.query', [], {",
      "    select: ['id'],",
      '  });',
      '});',
    ));
  });

  it('merges into an existing typed import and moves MockApiService', () => {
    const source = lines(
      "import { MockApiService } from 'app/core/testing/classes/mock-api.service';",
      "import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';",
      "import { mockTypedApi } from 'app/core/testing/utils/mock-typed-api.utils';",
      '',
      "providers: [mockTypedApi(), mockApi([mockCall('user.query', [])])];",
      "spectator.inject(MockApiService).mockCall('user.query', []);",
      "spectator.inject(MockApiService).mockCall('user.delete');",
    );

    const { output } = transformSpec(source, 'x.spec.ts');

    expect(output).toBe(lines(
      "import { MockTypedApiService } from 'app/core/testing/classes/mock-typed-api.service';",
      "import { mockTypedApi, mockTypedQuery } from 'app/core/testing/utils/mock-typed-api.utils';",
      '',
      "providers: [mockTypedApi(), mockTypedApi([mockTypedQuery('user.query', [])])];",
      "spectator.inject(MockTypedApiService).mockQuery('user.query', []);",
      "spectator.inject(MockTypedApiService).mockCall('user.delete', null);",
    ));
  });

  it('splits mockApi when some methods stay on the legacy client', () => {
    const source = lines(
      "import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';",
      "import { ApiService } from 'app/modules/websocket/api.service';",
      '',
      'providers: [',
      '  mockApi([',
      "    mockCall('cloudsync.credentials.query', []),",
      "    mockCall('cloudsync.create'),",
      '  ]),',
      '];',
      "expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('cloudsync.create', [{}]);",
      "expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('cloudsync.credentials.query', [[]]);",
    );

    const { output, notes } = transformSpec(source, 'x.spec.ts', {
      keepLegacy: (method) => method === 'cloudsync.create',
    });

    expect(output).toBe(lines(
      "import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';",
      "import { mockTypedApi, mockTypedQuery } from 'app/core/testing/utils/mock-typed-api.utils';",
      "import { ApiService } from 'app/modules/websocket/api.service';",
      "import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';",
      '',
      'providers: [',
      '  mockTypedApi([',
      "    mockTypedQuery('cloudsync.credentials.query', []),",
      '  ]),',
      '  mockApi([',
      "    mockCall('cloudsync.create'),",
      '  ]),',
      '];',
      "expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('cloudsync.create', [{}]);",
      "expect(spectator.inject(TypedApiService).query).toHaveBeenCalledWith('cloudsync.credentials.query', []);",
    ));
    expect(notes).toEqual([]);
  });

  it('keeps a method named by keepLegacy on the legacy double even when only its assertions name it', () => {
    const source = lines(
      "import { MockApiService } from 'app/core/testing/classes/mock-api.service';",
      "import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';",
      "import { ApiService } from 'app/modules/websocket/api.service';",
      '',
      "providers: [mockApi([mockCall('user.query', [])])];",
      "spectator.inject(MockApiService).mockCall('user.delete', null);",
      "expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('user.delete', [1]);",
    );

    const { output, notes } = transformSpec(source, 'x.spec.ts', {
      keepLegacy: (method) => method === 'user.delete',
    });

    expect(output).toContain("spectator.inject(MockApiService).mockCall('user.delete', null);");
    expect(output).toContain("expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('user.delete', [1]);");
    // Both references belong to the kept method, so nothing is left ambiguous.
    expect(notes).toEqual([]);
  });

  it('leaves an assertion on a method it could not convert pointed at the legacy double', () => {
    const source = lines(
      "import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';",
      "import { ApiService } from 'app/modules/websocket/api.service';",
      '',
      "expect(spectator.inject(ApiService).call).not.toHaveBeenCalledWith('audit.query', [[], { count: true }]);",
      'providers: [',
      '  mockApi([',
      "    mockCall('audit.query', (params) => []),",
      "    mockCall('system.info', {}),",
      '  ]),',
      '];',
    );

    const { output } = transformSpec(source, 'x.spec.ts');

    expect(output).toContain(
      "expect(spectator.inject(ApiService).call).not.toHaveBeenCalledWith('audit.query', [[], { count: true }]);",
    );
  });

  it('moves the double with a method scripted on it in a split spec', () => {
    const source = lines(
      "import { MockApiService } from 'app/core/testing/classes/mock-api.service';",
      '',
      "spectator.inject(MockApiService).mockCall('keychaincredential.query', []);",
      "spectator.inject(MockApiService).mockCall('user.delete', null);",
    );

    const { output } = transformSpec(source, 'x.spec.ts', {
      keepLegacy: (method) => !method.startsWith('keychaincredential.'),
    });

    expect(output).toBe(lines(
      "import { MockApiService } from 'app/core/testing/classes/mock-api.service';",
      "import { MockTypedApiService } from 'app/core/testing/classes/mock-typed-api.service';",
      '',
      "spectator.inject(MockTypedApiService).mockQuery('keychaincredential.query', []);",
      "spectator.inject(MockApiService).mockCall('user.delete', null);",
    ));
  });

  it('does not flag a call-count assertion when only mutations moved', () => {
    const source = lines(
      "import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';",
      '',
      "providers: [mockApi([mockCall('pool.update')])];",
      'expect(api.call).toHaveBeenCalledTimes(1);',
    );

    expect(transformSpec(source, 'x.spec.ts').notes).toEqual([]);
  });

  it('keeps a bare mockApi() when the run names what moved', () => {
    const source = lines(
      "import { mockApi } from 'app/core/testing/utils/mock-api.utils';",
      '',
      'providers: [mockApi()];',
    );

    const { output, notes } = transformSpec(source, 'x.spec.ts', { keepLegacy: () => true });

    expect(output).toBe(source);
    expect(notes).toEqual([{ line: 3, message: expect.stringContaining('Bare `mockApi()` kept') }]);
  });

  it('reports a call assertion that names no method', () => {
    const source = lines(
      "import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';",
      '',
      "providers: [mockApi([mockCall('user.query', [])])];",
      'expect(api.call).not.toHaveBeenCalled();',
      'expect(api.call).toHaveBeenCalledTimes(0);',
      'expect(dialog.open).not.toHaveBeenCalled();',
    );

    expect(transformSpec(source, 'x.spec.ts').notes).toEqual([
      { line: 4, message: expect.stringContaining('names no method') },
      { line: 5, message: expect.stringContaining('names no method') },
    ]);
  });

  it('reports a bare mockProvider(ApiService) and a call stub once queries moved', () => {
    const source = lines(
      "import { mockProvider } from '@ngneat/spectator/jest';",
      "import { ApiService } from 'app/modules/websocket/api.service';",
      '',
      'providers: [mockProvider(ApiService)];',
      "jest.spyOn(api, 'call').mockReturnValue(of([]));",
      "expect(api.call).toHaveBeenCalledWith('group.query', [[]]);",
    );

    const { output, notes } = transformSpec(source, 'x.spec.ts');

    expect(output).toContain("expect(api.query).toHaveBeenCalledWith('group.query', []);");
    expect(notes).toEqual([
      { line: 4, message: expect.stringContaining('a spy object leaves them undefined') },
      { line: 5, message: expect.stringContaining("`jest.spyOn(..., 'call')` in a spec whose queries moved") },
    ]);
  });

  it('leaves what it cannot translate on the legacy double and says where', () => {
    const source = lines(
      "import { mockProvider } from '@ngneat/spectator/jest';",
      "import { failApiCall, mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';",
      "import { ApiService } from 'app/modules/websocket/api.service';",
      '',
      'providers: [',
      '  mockApi([',
      "    mockCall('audit.query', (params) => []),",
      "    mockCall('system.info', {}),",
      '  ]),',
      '  mockProvider(ApiService, { call: jest.fn() }),',
      '];',
      'failApiCall(api, \'system.info\');',
      "jest.spyOn(api, 'call').mockImplementation((method) => (method === 'user.query' ? of([]) : of(null)));",
      "expect(api.call).toHaveBeenCalledWith('user.query', expect.anything());",
    );

    const { output, notes } = transformSpec(source, 'x.spec.ts');

    expect(output).toContain("mockTypedApi([\n    mockTypedCall('system.info', {}),\n  ]),\n  mockApi([\n    mockCall('audit.query'");
    expect(output).toContain("import { failApiCall, mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';");
    expect(notes.map((note) => note.line)).toEqual([7, 10, 10, 12, 13, 14]);
    expect(notes.map((note) => note.message)).toEqual([
      expect.stringContaining('takes rows, not a factory'),
      expect.stringContaining('`ApiService` / `MockApiService` references were not renamed'),
      expect.stringContaining('a spy object leaves them undefined'),
      expect.stringContaining('`failApiCall()`'),
      expect.stringContaining("Hand-written dispatch on `method === 'user.query'`"),
      expect.stringContaining('move it to `query` / `queryOne` / `queryCount` by hand'),
    ]);
  });

  it('does not count a member named like a helper as a use of the helper', () => {
    const source = lines(
      "import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';",
      '',
      "providers: [mockApi([mockCall('system.info', {})])];",
      "websocketMock.mockCall('system.info', {});",
    );

    expect(transformSpec(source, 'x.spec.ts').output).toBe(lines(
      "import { mockTypedApi, mockTypedCall } from 'app/core/testing/utils/mock-typed-api.utils';",
      '',
      "providers: [mockTypedApi([mockTypedCall('system.info', {})])];",
      "websocketMock.mockCall('system.info', {});",
    ));
  });

  it('lets a submit land before asserting on it, once a mutation has moved', () => {
    const source = lines(
      "import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';",
      '',
      "providers: [mockApi([mockCall('pool.update', null)])];",
      "it('saves', () => {",
      '  spectator.component.submit();',
      '  expect(closed).toHaveBeenCalled();',
      '  spectator.component.submit();',
      '});',
      "it('saves again', async () => {",
      '  spectator.component.submit();',
      '  await spectator.fixture.whenStable();',
      '});',
      'function save(): void {',
      '  spectator.component.submit();',
      '}',
    );

    const { output, notes } = transformSpec(source, 'x.spec.ts');

    expect(output).toBe(lines(
      "import { mockTypedApi, mockTypedCall } from 'app/core/testing/utils/mock-typed-api.utils';",
      '',
      "providers: [mockTypedApi([mockTypedCall('pool.update', null)])];",
      "it('saves', async () => {",
      '  spectator.component.submit();',
      '  await spectator.fixture.whenStable();',
      '  expect(closed).toHaveBeenCalled();',
      '  spectator.component.submit();',
      '  await spectator.fixture.whenStable();',
      '});',
      "it('saves again', async () => {",
      '  spectator.component.submit();',
      '  await spectator.fixture.whenStable();',
      '});',
      'function save(): void {',
      '  spectator.component.submit();',
      '}',
    ));
    expect(notes).toEqual([{ line: 14, message: expect.stringContaining('outside a test callback') }]);
  });

  it('lets a submit land when the mutation is scripted on the double rather than in the list', () => {
    const source = lines(
      "import { MockApiService } from 'app/core/testing/classes/mock-api.service';",
      "import { mockApi } from 'app/core/testing/utils/mock-api.utils';",
      '',
      'providers: [mockApi()];',
      "it('saves', () => {",
      "  spectator.inject(MockApiService).mockCall('pool.update', null);",
      '  spectator.component.submit();',
      '});',
    );

    expect(transformSpec(source, 'x.spec.ts').output).toContain(lines(
      "it('saves', async () => {",
      "  spectator.inject(MockTypedApiService).mockCall('pool.update', null);",
      '  spectator.component.submit();',
      '  await spectator.fixture.whenStable();',
      '});',
    ));
  });

  it('reports query options it cannot name rather than dropping them', () => {
    const source = lines(
      "import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';",
      '',
      "providers: [mockApi([mockCall('user.query', [])])];",
      "expect(api.call).toHaveBeenCalledWith('user.query', [[], { ...pageOptions, order_by: ['name'] }]);",
      "expect(api.call).toHaveBeenCalledWith('user.query', [[], { 'order_by': ['name'] }]);",
    );

    const { output, notes } = transformSpec(source, 'x.spec.ts');

    expect(output).toContain(lines(
      "expect(api.call).toHaveBeenCalledWith('user.query', [[], { ...pageOptions, order_by: ['name'] }]);",
      "expect(api.call).toHaveBeenCalledWith('user.query', [[], { 'order_by': ['name'] }]);",
    ));
    expect(notes.map((note) => note.line)).toEqual([4, 5]);
    expect(notes[0].message).toContain('move it to `query` / `queryOne` / `queryCount` by hand');
  });

  it('drops a legacy import on the last line of a file with no trailing newline', () => {
    const source = [
      "providers: [mockApi([mockCall('system.info', {})])];",
      "import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';",
    ].join('\n');

    expect(transformSpec(source, 'x.spec.ts').output).toBe(lines(
      "providers: [mockTypedApi([mockTypedCall('system.info', {})])];",
      "import { mockTypedApi, mockTypedCall } from 'app/core/testing/utils/mock-typed-api.utils';",
    ));
  });

  it('leaves a spec with nothing to convert alone', () => {
    const source = lines(
      "import { mockTypedApi } from 'app/core/testing/utils/mock-typed-api.utils';",
      '',
      'providers: [mockTypedApi()];',
    );

    expect(transformSpec(source, 'x.spec.ts')).toEqual({ output: source, changed: false, notes: [] });
  });
});
