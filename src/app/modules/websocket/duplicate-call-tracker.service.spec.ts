import { fakeAsync, tick } from '@angular/core/testing';
import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { DuplicateCallTrackerService } from 'app/modules/websocket/duplicate-call-tracker.service';

describe('DuplicateCallTrackerService', () => {
  let spectator: SpectatorService<DuplicateCallTrackerService>;

  const createService = createServiceFactory({
    service: DuplicateCallTrackerService,
  });

  beforeEach(() => {
    spectator = createService();
    jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('does not warn on first call', () => {
    spectator.service.trackCall('system.info', []);

    expect(console.warn).not.toHaveBeenCalled();
  });

  it('warns when same method with same params is called within time window', () => {
    spectator.service.trackCall('system.info', [{ foo: 'bar' }]);
    spectator.service.trackCall('system.info', [{ foo: 'bar' }]);

    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('[DuplicateApiCall] "system.info"'),
      [{ foo: 'bar' }],
      '\nOriginal call:',
      expect.any(String),
      '\nDuplicate call:',
      expect.any(String),
    );
  });

  it('does not warn when same method is called with different params', () => {
    spectator.service.trackCall('system.info', [{ foo: 'bar' }]);
    spectator.service.trackCall('system.info', [{ foo: 'baz' }]);

    expect(console.warn).not.toHaveBeenCalled();
  });

  it('does not warn when different methods are called with same params', () => {
    spectator.service.trackCall('system.info', [{ foo: 'bar' }]);
    spectator.service.trackCall('pool.query', [{ foo: 'bar' }]);

    expect(console.warn).not.toHaveBeenCalled();
  });

  it('does not warn when same call is made after time window expires', fakeAsync(() => {
    spectator.service.trackCall('system.info', []);

    tick(51);

    spectator.service.trackCall('system.info', []);

    expect(console.warn).not.toHaveBeenCalled();
  }));

  it('handles calls with no params', () => {
    spectator.service.trackCall('system.info');
    spectator.service.trackCall('system.info');

    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('[DuplicateApiCall] "system.info"'),
      undefined,
      '\nOriginal call:',
      expect.any(String),
      '\nDuplicate call:',
      expect.any(String),
    );
  });

  it('handles calls with empty params array', () => {
    spectator.service.trackCall('system.info', []);
    spectator.service.trackCall('system.info', []);

    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('[DuplicateApiCall] "system.info"'),
      [],
      '\nOriginal call:',
      expect.any(String),
      '\nDuplicate call:',
      expect.any(String),
    );
  });

  it('cleans up old calls from tracking', fakeAsync(() => {
    spectator.service.trackCall('system.info', []);

    tick(55);

    // Call a different method to trigger cleanup
    spectator.service.trackCall('pool.query', []);

    // Now call the original method again - should not warn since old call was cleaned up
    spectator.service.trackCall('system.info', []);

    expect(console.warn).not.toHaveBeenCalled();
  }));

  it('does not track calls when disabled', () => {
    spectator.service.setEnabled(false);

    spectator.service.trackCall('system.info', []);
    spectator.service.trackCall('system.info', []);

    expect(console.warn).not.toHaveBeenCalled();
  });

  it('handles circular references in params', () => {
    const obj: Record<string, unknown> = { foo: 'bar' };
    obj.self = obj;

    spectator.service.trackCall('system.info', [obj]);
    spectator.service.trackCall('system.info', [obj]);

    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('[DuplicateApiCall] "system.info"'),
      expect.any(Array),
      '\nOriginal call:',
      expect.any(String),
      '\nDuplicate call:',
      expect.any(String),
    );
  });
});
