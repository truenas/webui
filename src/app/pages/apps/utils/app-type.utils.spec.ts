import { App } from 'app/interfaces/app.interface';
import { isExternalApp, isTruenasApp } from './app-type.utils';

describe('App Type Utils', () => {
  describe('isExternalApp', () => {
    it('returns true for external apps', () => {
      const app = { source: 'EXTERNAL' } as App;
      expect(isExternalApp(app)).toBe(true);
    });

    it('returns false for TrueNAS apps', () => {
      const app = { source: 'TRUENAS' } as App;
      expect(isExternalApp(app)).toBe(false);
    });

    it('returns false for null', () => {
      expect(isExternalApp(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isExternalApp(undefined)).toBe(false);
    });
  });

  describe('isTruenasApp', () => {
    it('returns true for TrueNAS apps', () => {
      const app = { source: 'TRUENAS' } as App;
      expect(isTruenasApp(app)).toBe(true);
    });

    it('returns false for external apps', () => {
      const app = { source: 'EXTERNAL' } as App;
      expect(isTruenasApp(app)).toBe(false);
    });

    it('returns false for null', () => {
      expect(isTruenasApp(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isTruenasApp(undefined)).toBe(false);
    });
  });
});
