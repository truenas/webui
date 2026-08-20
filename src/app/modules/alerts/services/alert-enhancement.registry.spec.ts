import { AlertClassName } from 'app/enums/alert-class-name.enum';
import { Alert } from 'app/interfaces/alert.interface';
import { SmartAlertActionType, SmartAlertCategory } from 'app/interfaces/smart-alert.interface';
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

        expect(enhancement?.relatedMenuPath).toEqual(['credentials']);
        expect(enhancement?.bannerMenuPath).toEqual(['credentials', 'users', 'api-keys']);
        const action = enhancement?.actions?.[0];
        expect(action?.route).toEqual(['/credentials', 'users', 'api-keys']);
      },
    );
  });

  describe('Hardware alert coverage', () => {
    it.each([
      AlertClassName.SmartUncorrectedErrors,
      AlertClassName.SmartFailedSelfTest,
      AlertClassName.SmartSpareBlockCount,
      AlertClassName.SmartEraseCycleCount,
      AlertClassName.DiskTemperatureTooHot,
      AlertClassName.DifFormatted,
      AlertClassName.UsbStorage,
    ])('sends %s to the disk list', (klass) => {
      const enhancement = getAlertEnhancement('', klass, '', buildAlert(klass));

      expect(enhancement?.category).toBe(SmartAlertCategory.Hardware);
      expect(enhancement?.relatedMenuPath).toEqual(['storage', 'disks']);
      expect(enhancement?.actions?.[0]?.route).toEqual(['/storage', 'disks']);
    });

    it.each([
      AlertClassName.EnclosureUnhealthy,
      AlertClassName.EnclosureHealthy,
      AlertClassName.PowerSupply,
      AlertClassName.Sensor,
      AlertClassName.Nvdimm,
      AlertClassName.NvdimmEsLifetimeCritical,
      AlertClassName.NvdimmEsLifetimeWarning,
      AlertClassName.NvdimmMemoryModLifetimeCritical,
      AlertClassName.NvdimmMemoryModLifetimeWarning,
      AlertClassName.NvdimmInvalidFirmwareVersion,
      AlertClassName.NvdimmRecommendedFirmwareVersion,
    ])('sends %s to the enclosure view', (klass) => {
      const enhancement = getAlertEnhancement('', klass, '', buildAlert(klass));

      expect(enhancement?.category).toBe(SmartAlertCategory.Hardware);
      expect(enhancement?.relatedMenuPath).toEqual(['system', 'viewenclosure']);
      expect(enhancement?.actions?.[0]?.route).toEqual(['/system', 'viewenclosure']);
    });

    it.each([
      AlertClassName.SataDomWearCritical,
      AlertClassName.SataDomWearWarning,
    ])('sends %s to the boot pool', (klass) => {
      const enhancement = getAlertEnhancement('', klass, '', buildAlert(klass));

      expect(enhancement?.relatedMenuPath).toEqual(['system', 'boot']);
      expect(enhancement?.actions?.[0]?.route).toEqual(['/system', 'boot']);
    });

    // These need physical attention and have no page in webui. Badging the wrong menu is worse
    // than badging none — IPMISEL used to land on Network via the /ipmi/ pattern rule.
    it.each([
      AlertClassName.IpmiSel,
      AlertClassName.IpmiSelSpaceLeft,
      AlertClassName.MemoryErrors,
      AlertClassName.MemorySizeMismatch,
      AlertClassName.OldBiosVersion,
    ])('categorizes %s as hardware without badging a menu', (klass) => {
      const enhancement = getAlertEnhancement(
        '',
        klass,
        'IPMI system event log is 90% full',
        buildAlert(klass),
      );

      expect(enhancement?.category).toBe(SmartAlertCategory.Hardware);
      expect(enhancement?.relatedMenuPath).toBeUndefined();
      expect(enhancement?.actions?.[0]?.externalUrl).toBe('https://support.ixsystems.com');
    });
  });

  describe('Sharing alert coverage', () => {
    it.each([
      AlertClassName.NfsHostListExcessive,
      AlertClassName.NfsNetworkListExcessive,
      AlertClassName.NfsBlockedByExportsDir,
      AlertClassName.NfsExportMappingInvalidNames,
      AlertClassName.NfsHostnameLookupFail,
    ])('sends %s to the NFS shares', (klass) => {
      const enhancement = getAlertEnhancement('', klass, '', buildAlert(klass));

      expect(enhancement?.relatedMenuPath).toEqual(['sharing', 'nfs']);
      expect(enhancement?.actions?.[0]?.route).toEqual(['/sharing', 'nfs']);
    });

    it.each([
      AlertClassName.IscsiAuthSecretInvalidChar,
      AlertClassName.IscsiAuthSecretWhitespace,
      AlertClassName.IscsiDiscoveryAuthMixed,
      AlertClassName.IscsiDiscoveryAuthMultipleChap,
      AlertClassName.IscsiDiscoveryAuthMultipleMutualChap,
      AlertClassName.IscsiPortalIp,
      AlertClassName.FcHardwareAdded,
      AlertClassName.FcHardwareReplaced,
    ])('badges Shares for %s', (klass) => {
      const enhancement = getAlertEnhancement('', klass, '', buildAlert(klass));

      expect(enhancement?.relatedMenuPath).toEqual(['sharing', 'iscsi']);
      expect(enhancement?.actions?.[0]?.route?.[0]).toBe('/sharing');
    });

    it('sends NTLMv1 authentication to the SMB session list', () => {
      const enhancement = getAlertEnhancement(
        '',
        AlertClassName.Ntlmv1Authentication,
        '',
        buildAlert(AlertClassName.Ntlmv1Authentication),
      );

      expect(enhancement?.category).toBe(SmartAlertCategory.Security);
      expect(enhancement?.actions?.[0]?.route).toEqual(['/sharing', 'smb', 'status', 'sessions']);
    });
  });

  describe('High-availability alert coverage', () => {
    it.each([
      AlertClassName.FailoverFailed,
      AlertClassName.FailoverStatusCheckFailed,
      AlertClassName.FailoverRemoteSystemInaccessible,
      AlertClassName.FailoverReboot,
      AlertClassName.FencedReboot,
    ])('sends %s to the failover settings', (klass) => {
      const enhancement = getAlertEnhancement('', klass, '', buildAlert(klass));

      expect(enhancement?.relatedMenuPath).toEqual(['system', 'advanced']);
      expect(enhancement?.actions?.[0]?.label).toBe('Go to Failover Settings');
    });

    it.each([
      AlertClassName.FailoverInterfaceNotFound,
      AlertClassName.VrrpStatesDoNotAgree,
    ])('sends %s to the network interfaces', (klass) => {
      const enhancement = getAlertEnhancement('', klass, '', buildAlert(klass));

      expect(enhancement?.relatedMenuPath).toEqual(['system', 'network']);
      expect(enhancement?.actions?.[0]?.route).toEqual(['/system', 'network']);
    });

    it.each([
      AlertClassName.DisksAreNotPresentOnActiveNode,
      AlertClassName.DisksAreNotPresentOnStandbyNode,
    ])('sends %s to the disk list', (klass) => {
      const enhancement = getAlertEnhancement('', klass, '', buildAlert(klass));

      expect(enhancement?.relatedMenuPath).toEqual(['storage', 'disks']);
    });
  });

  // Regression: these entries pointed at ['network'] / ['/network'], which is not a route -
  // the Network menu item lives under System, so neither the badge nor the action worked.
  describe('Network alert routing', () => {
    it.each([
      AlertClassName.NoCriticalFailoverInterfaceFound,
      AlertClassName.NetworkCardsMismatchOnActiveNode,
      AlertClassName.NetworkCardsMismatchOnStandbyNode,
      AlertClassName.BondMissingPorts,
      AlertClassName.BondInactivePorts,
      AlertClassName.BondNoActivePorts,
    ])('routes %s under /system/network', (klass) => {
      const enhancement = getAlertEnhancement('', klass, '', buildAlert(klass));

      expect(enhancement?.relatedMenuPath).toEqual(['system', 'network']);
      expect(enhancement?.actions?.[0]?.route).toEqual(['/system', 'network']);
    });
  });

  describe('Account, audit and system alert coverage', () => {
    it.each([
      AlertClassName.AllAdminAccountsExpired,
      AlertClassName.LocalAccountExpired,
      AlertClassName.LocalAccountExpiring,
      AlertClassName.AdminSession,
      AlertClassName.AdminUserIsOverridden,
      AlertClassName.SmbUserMissingHash,
    ])('sends %s to the user list', (klass) => {
      const enhancement = getAlertEnhancement('', klass, '', buildAlert(klass));

      expect(enhancement?.relatedMenuPath).toEqual(['credentials', 'users']);
    });

    it.each([
      AlertClassName.AuditBackendSetup,
      AlertClassName.AuditServiceHealth,
      AlertClassName.AuditDatabaseCorrupted,
    ])('sends %s to the audit page', (klass) => {
      const enhancement = getAlertEnhancement('', klass, '', buildAlert(klass));

      expect(enhancement?.relatedMenuPath).toEqual(['system', 'audit']);
    });

    it.each([
      AlertClassName.KdumpNotReady,
      AlertClassName.NtpHealthCheck,
      AlertClassName.SyslogNg,
      AlertClassName.InvalidGpuPciIds,
      AlertClassName.FipsMisconfiguration,
    ])('sends %s to the advanced settings', (klass) => {
      const enhancement = getAlertEnhancement('', klass, '', buildAlert(klass));

      expect(enhancement?.relatedMenuPath).toEqual(['system', 'advanced']);
    });
  });

  // TrueCommand and TrueNAS Connect are topbar features with no route, so their alerts link out.
  describe('Remote service alert coverage', () => {
    it.each([
      [AlertClassName.TruecommandConnectionPending, 'https://portal.truenas.com'],
      [AlertClassName.TruecommandConnectionDisabled, 'https://portal.truenas.com'],
      [AlertClassName.TruecommandConnectionHealth, 'https://portal.truenas.com'],
      [AlertClassName.TruecommandContainerHealth, 'https://portal.truenas.com'],
      [AlertClassName.TncDisabledAutoUnconfigured, 'https://connect.truenas.com/'],
      [AlertClassName.TncHeartbeatConnectionFailure, 'https://connect.truenas.com/'],
    ])('links %s out to the service instead of badging a menu', (klass, url) => {
      const enhancement = getAlertEnhancement('', klass, '', buildAlert(klass));

      expect(enhancement?.relatedMenuPath).toBeUndefined();
      expect(enhancement?.actions?.[0]?.type).toBe(SmartAlertActionType.ExternalLink);
      expect(enhancement?.actions?.[0]?.externalUrl).toBe(url);
    });
  });

  describe('UPS alert coverage', () => {
    it.each([
      AlertClassName.UpsBatteryLow,
      AlertClassName.UpsReplaceBattery,
      AlertClassName.UpsOnBattery,
      AlertClassName.UpsOnline,
      AlertClassName.UpsCommunicationOk,
    ])('sends %s to the UPS service', (klass) => {
      const enhancement = getAlertEnhancement('', klass, '', buildAlert(klass));

      expect(enhancement?.relatedMenuPath).toEqual(['system', 'services']);
      expect(enhancement?.actions?.[0]?.fragment).toBe('ups');
    });
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
