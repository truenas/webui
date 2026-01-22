import { App } from 'app/interfaces/app.interface';
import { analyzeVersionChange } from './version-comparison.utils';

describe('analyzeVersionChange', () => {
  it('returns no changes when upgrade_available is false', () => {
    const app = {
      upgrade_available: false,
      version: '1.0.0',
      latest_version: '1.0.1',
      latest_app_version: '2.0.1',
      human_version: '2.0.0_1.0.0',
      metadata: {
        app_version: '2.0.0',
      },
    } as App;

    const result = analyzeVersionChange(app);

    expect(result).toEqual({
      hasAppVersionChange: false,
      hasRevisionChange: false,
    });
  });

  it('detects revision-only change when app version stays the same', () => {
    const app = {
      upgrade_available: true,
      version: '1.0.0',
      latest_version: '1.0.1',
      latest_app_version: '2.0.0',
      human_version: '2.0.0_1.0.0',
      metadata: {
        app_version: '2.0.0',
      },
    } as App;

    const result = analyzeVersionChange(app);

    expect(result).toEqual({
      hasAppVersionChange: false,
      hasRevisionChange: true,
    });
  });

  it('detects app version change', () => {
    const app = {
      upgrade_available: true,
      version: '1.0.0',
      latest_version: '1.0.1',
      latest_app_version: '2.1.0',
      human_version: '2.0.0_1.0.0',
      metadata: {
        app_version: '2.0.0',
      },
    } as App;

    const result = analyzeVersionChange(app);

    expect(result).toEqual({
      hasAppVersionChange: true,
      hasRevisionChange: true,
    });
  });

  it('detects both app version and revision changes', () => {
    const app = {
      upgrade_available: true,
      version: '1.0.0',
      latest_version: '1.0.2',
      latest_app_version: '3.0.0',
      human_version: '2.0.0_1.0.0',
      metadata: {
        app_version: '2.0.0',
      },
    } as App;

    const result = analyzeVersionChange(app);

    expect(result).toEqual({
      hasAppVersionChange: true,
      hasRevisionChange: true,
    });
  });

  it('handles apps where human_version equals version (no app version suffix)', () => {
    const app = {
      upgrade_available: true,
      version: '1.0.0',
      latest_version: '1.0.1',
      latest_app_version: '1.0.0',
      human_version: '1.0.0',
      metadata: {
        app_version: '1.0.0',
      },
    } as App;

    const result = analyzeVersionChange(app);

    expect(result).toEqual({
      hasAppVersionChange: false,
      hasRevisionChange: true,
    });
  });

  it('handles undefined human_version', () => {
    const app = {
      upgrade_available: true,
      version: '1.0.0',
      latest_version: '1.0.1',
      latest_app_version: '1.0.1',
      human_version: undefined,
      metadata: {
        app_version: '1.0.0',
      },
    } as App;

    const result = analyzeVersionChange(app);

    expect(result).toEqual({
      hasAppVersionChange: true,
      hasRevisionChange: true,
    });
  });
});
