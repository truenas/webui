// cspell:ignore volsize
import { inherit } from 'app/enums/with-inherit.enum';
import { FormPayloadTracker } from 'app/helpers/form-payload-tracker.class';

describe('FormPayloadTracker', () => {
  let tracker: FormPayloadTracker;

  beforeEach(() => {
    tracker = new FormPayloadTracker();
  });

  describe('diff', () => {
    it('returns full payload when no initial payload was captured', () => {
      const payload = { sync: 'STANDARD', compression: 'LZ4' };
      expect(tracker.diff(payload)).toEqual({ sync: 'STANDARD', compression: 'LZ4' });
    });

    it('returns empty object when nothing changed', () => {
      tracker.capture({ sync: 'STANDARD', compression: 'LZ4' });
      expect(tracker.diff({ sync: 'STANDARD', compression: 'LZ4' })).toEqual({});
    });

    it('returns only changed properties', () => {
      tracker.capture({ sync: 'STANDARD', compression: 'LZ4' });
      expect(tracker.diff({ sync: 'ALWAYS', compression: 'LZ4' })).toEqual({ sync: 'ALWAYS' });
    });

    it('preserves new properties not in initial payload', () => {
      tracker.capture({ sync: 'STANDARD' });
      expect(tracker.diff({ sync: 'STANDARD', comments: 'new' })).toEqual({ comments: 'new' });
    });

    it('compares the inherit symbol correctly', () => {
      tracker.capture({ readonly: inherit, sync: 'STANDARD' });
      expect(tracker.diff({ readonly: inherit, sync: inherit })).toEqual({ sync: inherit });
    });

    it('does not re-add properties that were removed from the current payload', () => {
      tracker.capture({ sync: 'STANDARD', compression: 'LZ4', snapdev: 'HIDDEN' });
      expect(tracker.diff({ sync: 'ALWAYS' })).toEqual({ sync: 'ALWAYS' });
    });

    it('does not mutate the input payload', () => {
      tracker.capture({ sync: 'STANDARD', compression: 'LZ4' });
      const payload = { sync: 'STANDARD', compression: 'LZ4' };
      tracker.diff(payload);
      expect(payload).toEqual({ sync: 'STANDARD', compression: 'LZ4' });
    });
  });

  describe('applyDiff', () => {
    it('is a no-op when no initial payload was captured', () => {
      const data = { volsize: 1024, sync: 'STANDARD' } as Record<string, unknown>;
      tracker.applyDiff(data, { sync: 'STANDARD' });
      expect(data).toEqual({ volsize: 1024, sync: 'STANDARD' });
    });

    it('removes unchanged managed keys and merges back changed ones', () => {
      tracker.capture({ sync: 'STANDARD', compression: 'LZ4', snapdev: 'HIDDEN' });
      const data = {
        volsize: 1024, sync: 'ALWAYS', compression: 'LZ4', snapdev: 'HIDDEN',
      } as Record<string, unknown>;
      tracker.applyDiff(data, { sync: 'ALWAYS', compression: 'LZ4', snapdev: 'HIDDEN' });
      expect(data).toEqual({ volsize: 1024, sync: 'ALWAYS' });
    });

    it('preserves non-managed keys in data', () => {
      tracker.capture({ sync: 'STANDARD' });
      const data = { volsize: 2048, encryption: true, sync: 'STANDARD' } as Record<string, unknown>;
      tracker.applyDiff(data, { sync: 'STANDARD' });
      expect(data).toEqual({ volsize: 2048, encryption: true });
    });
  });

  describe('hasCaptured', () => {
    it('returns false before capture', () => {
      expect(tracker.hasCaptured).toBe(false);
    });

    it('returns true after capture', () => {
      tracker.capture({ sync: 'STANDARD' });
      expect(tracker.hasCaptured).toBe(true);
    });
  });
});
