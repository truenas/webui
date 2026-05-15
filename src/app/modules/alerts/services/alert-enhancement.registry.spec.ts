import { AlertClassName } from 'app/enums/alert-class-name.enum';
import { Alert } from 'app/interfaces/alert.interface';
import { SmartAlertActionType } from 'app/interfaces/smart-alert.interface';
import { getAlertEnhancement } from 'app/modules/alerts/services/alert-enhancement.registry';

describe('alert-enhancement.registry route fixes (NAS-140943)', () => {
  const buildAlert = (klass: AlertClassName | string, overrides: Partial<Alert> = {}): Alert => ({
    id: '1',
    klass: klass as AlertClassName,
    source: '',
    formatted: '',
    text: '',
    args: null,
    ...overrides,
  } as Alert);

  describe('FIPS restart action', () => {
    it('points to /system-tasks/restart instead of /system/general', () => {
      const enhancement = getAlertEnhancement('FipsProvider');
      const restartAction = enhancement?.actions?.find((action) => action.label === 'Restart System');

      expect(restartAction?.route).toEqual(['/system-tasks', 'restart']);
      expect(restartAction?.type).toBe(SmartAlertActionType.Navigate);
    });
  });

  describe('SnapshotFailed action', () => {
    it('uses the "View Snapshot Tasks" label and routes to data-protection/snapshot', () => {
      const enhancement = getAlertEnhancement(
        '',
        AlertClassName.SnapshotFailed,
        'Snapshot task "tank/data" failed',
        buildAlert(AlertClassName.SnapshotFailed),
      );

      const action = enhancement?.actions?.[0];
      expect(action?.label).toBe('View Snapshot Tasks');
      expect(action?.route).toEqual(['/data-protection', 'snapshot']);
    });
  });

  describe('Apps installed action', () => {
    it('does not include a redundant "installed" fragment when the route already segments to installed', () => {
      const enhancement = getAlertEnhancement(
        '',
        AlertClassName.ApplicationsConfigurationFailed,
        '',
        buildAlert(AlertClassName.ApplicationsConfigurationFailed),
      );

      const action = enhancement?.actions?.[0];
      expect(action?.route).toEqual(['/apps', 'installed']);
      expect(action?.fragment).toBeUndefined();
    });
  });

  describe('Failover sync alerts', () => {
    it.each([
      AlertClassName.FailoverSyncFailed,
      AlertClassName.FailoverKeysSyncFailed,
    ])('navigates %s to /system/advanced with failover-card fragment', (klass) => {
      const enhancement = getAlertEnhancement('', klass, '', buildAlert(klass));

      expect(enhancement?.relatedMenuPath).toEqual(['system', 'advanced']);
      const action = enhancement?.actions?.[0];
      expect(action?.route).toEqual(['/system', 'advanced']);
      expect(action?.fragment).toBe('failover-card');
    });
  });

  describe('JBOF alerts', () => {
    it.each([
      AlertClassName.JbofRedfishComm,
      AlertClassName.JbofElementCritical,
      AlertClassName.JbofElementWarning,
      AlertClassName.JbofTearDownFailure,
      AlertClassName.JbofInvalidData,
    ])('navigates %s to /system/viewenclosure/jbof', (klass) => {
      const enhancement = getAlertEnhancement('', klass, '', buildAlert(klass));

      expect(enhancement?.relatedMenuPath).toEqual(['system', 'viewenclosure', 'jbof']);
      const action = enhancement?.actions?.[0];
      expect(action?.route).toEqual(['/system', 'viewenclosure', 'jbof']);
    });
  });

  describe('Snapshot count alerts', () => {
    it.each([
      AlertClassName.SnapshotTotalCount,
      AlertClassName.SnapshotCount,
    ])('navigates %s to /datasets/snapshots', (klass) => {
      const enhancement = getAlertEnhancement('', klass, '', buildAlert(klass));

      expect(enhancement?.relatedMenuPath).toEqual(['datasets', 'snapshots']);
      const action = enhancement?.actions?.[0];
      expect(action?.route).toEqual(['/datasets', 'snapshots']);
    });
  });

  describe('API key alerts', () => {
    it.each(['ApiKeyRevoked', 'APIFailedLogin'])(
      'navigates %s to /credentials/users/api-keys',
      (klass) => {
        const enhancement = getAlertEnhancement('', klass, '', buildAlert(klass));

        expect(enhancement?.relatedMenuPath).toEqual(['credentials', 'users', 'api-keys']);
        const action = enhancement?.actions?.[0];
        expect(action?.route).toEqual(['/credentials', 'users', 'api-keys']);
      },
    );
  });

  describe('Scrub finished/not started alerts', () => {
    it.each([
      AlertClassName.ScrubFinished,
      AlertClassName.ScrubNotStarted,
    ])('navigates %s to /storage with the View Storage label', (klass) => {
      const enhancement = getAlertEnhancement('', klass, '', buildAlert(klass));

      const action = enhancement?.actions?.[0];
      expect(action?.label).toBe('View Storage');
      expect(action?.route).toEqual(['/storage']);
    });
  });
});
