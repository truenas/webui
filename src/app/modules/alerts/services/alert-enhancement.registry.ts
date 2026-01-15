import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { Alert } from 'app/interfaces/alert.interface';
import {
  SmartAlertAction,
  SmartAlertActionType,
  SmartAlertCategory,
  SmartAlertConfig,
  SmartAlertEnhancement,
  ConditionalSmartAlertEnhancement,
  createFragmentExtractor,
  createTaskIdExtractor,
  isConditionalEnhancement,
  resolveConditionalEnhancement,
} from 'app/interfaces/smart-alert.interface';
import { routePlaceholders } from 'app/modules/alerts/constants/route-placeholders.const';
import { isBootPoolAlert } from 'app/modules/alerts/utils/boot-pool.utils';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { bootListElements } from 'app/pages/system/bootenv/bootenv-list/bootenv-list.elements';

/**
 * Registry of smart alert enhancements that map alert sources and classes
 * to actionable items, contextual help, and navigation paths.
 *
 * This registry enriches basic alerts with:
 * - Quick action buttons (navigate, external links, automated fixes)
 * - Contextual help text
 * - Related menu paths for navigation badges
 * - Category grouping for better organization
 */
export const smartAlertRegistry: SmartAlertConfig = {
  bySource: {
    /**
     * License and Support Alerts
     */
    LicenseStatus: {
      category: SmartAlertCategory.System,
      relatedMenuPath: ['system', 'general'],
      contextualHelp: T('License issues can affect system features and support eligibility. Update your license to restore full functionality.'),
      documentationUrl: 'https://www.truenas.com/docs/scale/scaletutorials/systemsettings/general/addlicenseproactivesupport/',
      actions: [
        {
          label: T('Manage License'),
          type: SmartAlertActionType.Navigate,
          icon: iconMarker('mdi-license'),
          route: ['/system', 'general'],
          fragment: 'support',
          primary: true,
        },
        {
          label: T('Contact Support'),
          type: SmartAlertActionType.ExternalLink,
          icon: iconMarker('mdi-help-circle'),
          externalUrl: 'https://support.ixsystems.com',
        },
        {
          label: T('View Documentation'),
          type: SmartAlertActionType.ExternalLink,
          icon: iconMarker('mdi-book-open-variant'),
          externalUrl: 'https://www.truenas.com/docs/scale/scaletutorials/systemsettings/general/addlicenseproactivesupport/',
        },
      ],
    },

    ProactiveSupport: {
      category: SmartAlertCategory.System,
      relatedMenuPath: ['system', 'general'],
      contextualHelp: T('Proactive Support helps iXsystems monitor your system health and provide early warnings. Configuration takes just a few minutes.'),
      documentationUrl: 'https://www.truenas.com/docs/scale/scaletutorials/systemsettings/general/addlicenseproactivesupport/',
      actions: [
        {
          label: T('Configure Support'),
          type: SmartAlertActionType.Navigate,
          icon: iconMarker('mdi-cog'),
          route: ['/system', 'general'],
          fragment: 'support',
          primary: true,
        },
        {
          label: T('Learn More'),
          type: SmartAlertActionType.ExternalLink,
          icon: iconMarker('mdi-information'),
          externalUrl: 'https://www.truenas.com/docs/scale/scaletutorials/systemsettings/general/addlicenseproactivesupport/',
        },
      ],
    },

    UnsupportedHardware: {
      category: SmartAlertCategory.Hardware,
      relatedMenuPath: ['system', 'general'],
      contextualHelp: T('Your system is running on hardware that is not officially supported by iXsystems. This may affect stability, performance, and support eligibility.'),
      documentationUrl: 'https://www.truenas.com/docs/scale/gettingstarted/scalehardwareguide/',
      actions: [
        {
          label: T('Manage License'),
          type: SmartAlertActionType.Navigate,
          icon: iconMarker('mdi-license'),
          route: ['/system', 'general'],
          fragment: 'support',
          primary: true,
        },
        {
          label: T('Contact Support'),
          type: SmartAlertActionType.ExternalLink,
          icon: iconMarker('mdi-help-circle'),
          externalUrl: 'https://support.ixsystems.com',
        },
        {
          label: T('View Documentation'),
          type: SmartAlertActionType.ExternalLink,
          icon: iconMarker('mdi-book-open-variant'),
          externalUrl: 'https://www.truenas.com/docs/scale/gettingstarted/scalehardwareguide/',
        },
      ],
    },

    /**
     * Certificate Alerts
     */
    CertificateAlert: {
      category: SmartAlertCategory.Security,
      relatedMenuPath: ['credentials', 'certificates'],
      contextualHelp: T('Certificate issues can prevent secure connections and service access. Review and renew certificates before expiration.'),
      documentationUrl: 'https://www.truenas.com/docs/scale/scaletutorials/credentials/certificates/certificatesscale/',
      actions: [
        {
          label: T('Renew Certificate'),
          type: SmartAlertActionType.Navigate,
          icon: iconMarker('mdi-certificate'),
          route: ['/credentials', 'certificates'],
          primary: true,
        },
        {
          label: T('Certificate Guide'),
          type: SmartAlertActionType.ExternalLink,
          icon: iconMarker('mdi-book-open-variant'),
          externalUrl: 'https://www.truenas.com/docs/scale/scaletutorials/credentials/certificates/certificatesscale/',
        },
      ],
    },

    /**
     * Authentication and Account Security Alerts
     */
    RootLogin: {
      category: SmartAlertCategory.Security,
      relatedMenuPath: ['credentials', 'users'],
      contextualHelp: T('Using the root account for routine tasks poses security risks. Create dedicated administrator accounts with unique credentials for better security and accountability.'),
      documentationUrl: 'https://www.truenas.com/docs/scale/scaletutorials/credentials/managelocalusersscale/',
      actions: [
        {
          label: T('Manage Users'),
          type: SmartAlertActionType.Navigate,
          icon: iconMarker('mdi-account-multiple'),
          route: ['/credentials', 'users'],
          primary: true,
        },
        {
          label: T('User Management Guide'),
          type: SmartAlertActionType.ExternalLink,
          icon: iconMarker('mdi-book-open-variant'),
          externalUrl: 'https://www.truenas.com/docs/scale/scaletutorials/credentials/managelocalusersscale/',
        },
      ],
    },

    FipsProvider: {
      category: SmartAlertCategory.Security,
      relatedMenuPath: ['system', 'advanced'],
      contextualHelp: T('FIPS mode is enabled but the FIPS cryptographic provider is not active. A system restart is required to activate FIPS. FIPS 140-2 compliance requires the provider to be active.'),
      actions: [
        {
          label: T('System Security Settings'),
          type: SmartAlertActionType.Navigate,
          icon: iconMarker('security'),
          route: ['/system', 'advanced'],
          primary: true,
        },
        {
          label: T('Restart System'),
          type: SmartAlertActionType.Navigate,
          icon: iconMarker('mdi-restart'),
          route: ['/system', 'general'],
        },
      ],
    },

    /**
     * NVDIMM Hardware Alerts
     */
    NvdimmStatus: {
      category: SmartAlertCategory.Hardware,
      relatedMenuPath: ['system', 'viewenclosure'],
      contextualHelp: T('NVDIMM errors indicate issues with non-volatile memory modules. These can affect system stability and data integrity. Contact support for hardware diagnostics.'),
      actions: [
        {
          label: T('View Enclosure'),
          type: SmartAlertActionType.Navigate,
          icon: iconMarker('mdi-server'),
          route: ['/system', 'viewenclosure'],
          primary: true,
        },
        {
          label: T('Contact Support'),
          type: SmartAlertActionType.ExternalLink,
          icon: iconMarker('mdi-help-circle'),
          externalUrl: 'https://support.ixsystems.com',
        },
      ],
    },

    /**
     * Storage and Pool Alerts
     */
    VolumeStatus: {
      category: SmartAlertCategory.Storage,
      relatedMenuPath: ['storage'],
      contextualHelp: T('Storage pool health is critical for data integrity. Investigate and resolve pool issues immediately to prevent data loss.'),
      detailedHelp: T('Common pool issues include: degraded pools (missing/failed drives), scrub errors, capacity warnings, and replication problems.'),
      documentationUrl: 'https://www.truenas.com/docs/scale/scaletutorials/storage/managepoolsscale/',
      extractApiParams: (alert: { args: unknown; text: string; formatted: string }) => {
        // Try to extract pool ID from alert args first
        if (alert.args && typeof alert.args === 'object' && 'id' in alert.args) {
          return { poolId: (alert.args as { id: number }).id };
        }

        // Fallback: extract pool name from message text
        // Format: "Pool {name} state is OFFLINE" or similar
        const message = alert.formatted || alert.text;
        const poolNameMatch = /Pool\s+(\S+)\s+state/i.exec(message);
        if (poolNameMatch?.[1]) {
          return { poolId: poolNameMatch[1] };
        }

        return undefined;
      },
      actions: [
        {
          label: T('View VDEVs'),
          type: SmartAlertActionType.Navigate,
          icon: iconMarker('mdi-database'),
          route: ['/storage', routePlaceholders.poolId, 'vdevs'],
          primary: true,
        },
        {
          label: T('Managing Pools Guide'),
          type: SmartAlertActionType.ExternalLink,
          icon: iconMarker('mdi-book-open-variant'),
          externalUrl: 'https://www.truenas.com/docs/scale/scaletutorials/storage/managepoolsscale/',
        },
        {
          label: T('Storage Documentation'),
          type: SmartAlertActionType.ExternalLink,
          icon: iconMarker('mdi-help-circle'),
          externalUrl: 'https://www.truenas.com/docs/scale/scaletutorials/storage/',
        },
      ],
    },

    PoolCapacity: {
      category: SmartAlertCategory.Storage,
      relatedMenuPath: ['storage'],
      contextualHelp: T('High pool usage can impact performance and prevent new data writes. Consider expanding capacity or cleaning up old data.'),
      actions: [
        {
          label: T('View Storage'),
          type: SmartAlertActionType.Navigate,
          icon: iconMarker('mdi-database'),
          route: ['/storage'],
          primary: true,
        },
        {
          label: T('Managing Pools Guide'),
          type: SmartAlertActionType.ExternalLink,
          icon: iconMarker('mdi-book-open-variant'),
          externalUrl: 'https://www.truenas.com/docs/scale/scaletutorials/storage/managepoolsscale/',
        },
      ],
    },

    /**
     * Network Alerts
     */
    IPMIStatus: {
      category: SmartAlertCategory.Network,
      relatedMenuPath: ['system', 'network'],
      contextualHelp: T('IPMI connectivity issues can prevent remote management. Check network configuration and IPMI settings.'),
      documentationUrl: 'https://www.truenas.com/docs/scale/scaletutorials/network/',
      actions: [
        {
          label: T('Configure IPMI'),
          type: SmartAlertActionType.Navigate,
          icon: iconMarker('mdi-lan'),
          route: ['/system', 'network'],
          fragment: 'ipmi',
          primary: true,
        },
        {
          label: T('Network Settings'),
          type: SmartAlertActionType.Navigate,
          icon: iconMarker('mdi-network'),
          route: ['/system', 'network'],
        },
      ],
    },

    /**
     * Service Alerts
     */
    ServiceMonitor: {
      category: SmartAlertCategory.Services,
      relatedMenuPath: ['system', 'services'],
      contextualHelp: T('Service failures can interrupt critical functionality. Review service logs and configuration to identify the cause.'),
      actions: [
        {
          label: T('View Services'),
          type: SmartAlertActionType.Navigate,
          icon: iconMarker('mdi-cog'),
          route: ['/system', 'services'],
          primary: true,
        },
      ],
    },

    /**
     * Application Alerts
     */
    ApplicationsStatus: {
      category: SmartAlertCategory.Applications,
      relatedMenuPath: ['apps'],
      contextualHelp: T('Application issues may be caused by misconfiguration, resource constraints, or storage problems.'),
      documentationUrl: 'https://www.truenas.com/docs/scale/scaletutorials/apps/',
      actions: [
        {
          label: T('View Applications'),
          type: SmartAlertActionType.Navigate,
          icon: iconMarker('mdi-application'),
          route: ['/apps', 'installed'],
          primary: true,
        },
        {
          label: T('App Troubleshooting'),
          type: SmartAlertActionType.ExternalLink,
          icon: iconMarker('mdi-book-open-variant'),
          externalUrl: 'https://www.truenas.com/docs/scale/scaletutorials/apps/',
        },
      ],
    },

    /**
     * Update Alerts
     */
    UpdateCheck: {
      category: SmartAlertCategory.System,
      relatedMenuPath: ['system', 'update'],
      contextualHelp: T('System updates include security patches, bug fixes, and new features. Review release notes before updating.'),
      documentationUrl: 'https://www.truenas.com/docs/scale/gettingstarted/scaleupgrades/',
      actions: [
        {
          label: T('Check for Updates'),
          type: SmartAlertActionType.Navigate,
          icon: iconMarker('mdi-update'),
          route: ['/system', 'update'],
          primary: true,
        },
        {
          label: T('Release Notes'),
          type: SmartAlertActionType.ExternalLink,
          icon: iconMarker('mdi-note-text'),
          externalUrl: 'https://www.truenas.com/docs/scale/gettingstarted/scalereleasenotes/',
        },
      ],
    },

    ScrubTaskFailed: {
      category: SmartAlertCategory.Storage,
      relatedMenuPath: ['storage'],
      contextualHelp: T('Scrub failures may indicate disk errors or pool corruption. Investigate pool health and scheduled scrub tasks immediately.'),
      actions: [
        {
          label: T('View Storage'),
          type: SmartAlertActionType.Navigate,
          icon: iconMarker('dns'),
          route: ['/storage'],
          primary: true,
        },
      ],
    },

    /**
     * Hardware Alerts
     */
    HardwareStatus: {
      category: SmartAlertCategory.Hardware,
      relatedMenuPath: ['system', 'viewenclosure'],
      contextualHelp: T('Hardware issues require immediate attention. Check system health, temperatures, and component status.'),
      actions: [
        {
          label: T('View Enclosure'),
          type: SmartAlertActionType.Navigate,
          icon: iconMarker('mdi-server'),
          route: ['/system', 'viewenclosure'],
          primary: true,
        },
        {
          label: T('Contact Support'),
          type: SmartAlertActionType.ExternalLink,
          icon: iconMarker('mdi-help-circle'),
          externalUrl: 'https://support.ixsystems.com',
        },
      ],
    },

    /**
     * UPS Alerts
     */
    UpsStatus: {
      category: SmartAlertCategory.Hardware,
      relatedMenuPath: ['system'],
      contextualHelp: T('UPS issues can affect power protection. Verify UPS connection and battery health.'),
      actions: [
        {
          label: T('Configure UPS'),
          type: SmartAlertActionType.Navigate,
          icon: iconMarker('mdi-flash'),
          route: ['/system', 'services'],
          fragment: 'ups',
          primary: true,
        },
      ],
    },
  },

  byClass: {
    // Additional mappings by AlertClassName can be added here
    // These will override or extend bySource mappings
    CloudBackupTaskFailed: {
      category: SmartAlertCategory.Tasks,
      relatedMenuPath: ['data-protection', 'cloud-backup'],
      contextualHelp: T('Cloud backup failures may be caused by network connectivity issues, insufficient cloud storage space, invalid credentials, or expired authentication tokens.'),
      documentationUrl: 'https://www.truenas.com/docs/scale/scaletutorials/dataprotection/truecloudtasks/',
      actions: [
        {
          label: T('Rerun Cloud Backup'),
          type: SmartAlertActionType.RunTask,
          icon: iconMarker('mdi-play-circle'),
          apiMethod: 'cloud_backup.sync',
          primary: true,
          requiresConfirmation: true,
        },
        {
          label: T('View Cloud Backup'),
          type: SmartAlertActionType.Navigate,
          icon: iconMarker('mdi-cloud-upload'),
          route: ['/data-protection', 'cloud-backup'],
        },
        {
          label: T('Check Credentials'),
          type: SmartAlertActionType.Navigate,
          icon: iconMarker('mdi-key'),
          route: ['/credentials', 'backup-credentials'],
        },
        {
          label: T('Backup Documentation'),
          type: SmartAlertActionType.ExternalLink,
          icon: iconMarker('mdi-book-open-variant'),
          externalUrl: 'https://www.truenas.com/docs/scale/scaletutorials/dataprotection/truecloudtasks/',
        },
      ],
      extractFragment: createFragmentExtractor(
        'cloud-backup',
        /Cloud\s+Backup(?:\s+Task)?\s+"([^"]+)"/i,
        'cloud-backup-tasks',
      ),
      extractApiParams: createTaskIdExtractor(),
    },

    CloudSyncTaskFailed: {
      category: SmartAlertCategory.Tasks,
      relatedMenuPath: ['data-protection', 'cloudsync'],
      contextualHelp: T('Cloud sync failures may be due to network issues, credential problems, or cloud provider limitations.'),
      documentationUrl: 'https://www.truenas.com/docs/scale/scaletutorials/dataprotection/cloudsynctasks/',
      actions: [
        {
          label: T('Rerun Cloud Sync'),
          type: SmartAlertActionType.RunTask,
          icon: iconMarker('mdi-play-circle'),
          apiMethod: 'cloudsync.sync',
          primary: true,
          requiresConfirmation: true,
        },
        {
          label: T('View Cloud Sync'),
          type: SmartAlertActionType.Navigate,
          icon: iconMarker('mdi-cloud-sync'),
          route: ['/data-protection', 'cloudsync'],
        },
      ],
      extractFragment: createFragmentExtractor(
        'cloudsync-task',
        /Cloud\s+Sync(?:\s+Task)?\s+"([^"]+)"/i,
      ),
      extractApiParams: createTaskIdExtractor(),
    },

    ReplicationFailed: {
      category: SmartAlertCategory.Tasks,
      relatedMenuPath: ['data-protection', 'replication'],
      contextualHelp: T('Replication failures can cause backup gaps. Check network connectivity and destination system health.'),
      documentationUrl: 'https://www.truenas.com/docs/scale/scaletutorials/dataprotection/replication/',
      actions: [
        {
          label: T('Rerun Replication'),
          type: SmartAlertActionType.RunTask,
          icon: iconMarker('mdi-play-circle'),
          apiMethod: 'replication.run',
          primary: true,
          requiresConfirmation: true,
        },
        {
          label: T('View Replication'),
          type: SmartAlertActionType.Navigate,
          icon: iconMarker('mdi-sync'),
          route: ['/data-protection', 'replication'],
        },
      ],
      extractFragment: createFragmentExtractor(
        'replication-task',
        /Replication\s+"([^"]+)"/i,
        undefined,
        (value) => value.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase(),
      ),
      extractApiParams: createTaskIdExtractor(),
    },

    RsyncFailed: {
      category: SmartAlertCategory.Tasks,
      relatedMenuPath: ['data-protection', 'rsync'],
      contextualHelp: T('Rsync task failures may be due to connectivity issues, permission problems, or incorrect paths.'),
      documentationUrl: 'https://www.truenas.com/docs/scale/scaletutorials/dataprotection/rsynctasksscale/',
      actions: [
        {
          label: T('Rerun Rsync Task'),
          type: SmartAlertActionType.RunTask,
          icon: iconMarker('mdi-play-circle'),
          apiMethod: 'rsynctask.run',
          primary: true,
          requiresConfirmation: true,
        },
        {
          label: T('View Rsync Tasks'),
          type: SmartAlertActionType.Navigate,
          icon: iconMarker('mdi-sync'),
          route: ['/data-protection', 'rsync'],
        },
      ],
      extractFragment: createFragmentExtractor(
        'rsync-task',
        /Rsync(?:\s+task)?\s+"([^"]+)"/i,
        'rsync-tasks',
      ),
      extractApiParams: createTaskIdExtractor(),
    },

    SnapshotFailed: {
      category: SmartAlertCategory.Tasks,
      relatedMenuPath: ['data-protection', 'snapshot'],
      contextualHelp: T('Snapshot failures may indicate storage issues or misconfigured retention policies. Snapshot tasks run automatically on schedule and cannot be manually triggered.'),
      actions: [
        {
          label: T('View Snapshots'),
          type: SmartAlertActionType.Navigate,
          icon: iconMarker('mdi-camera'),
          route: ['/data-protection', 'snapshot'],
          primary: true,
        },
      ],
      extractFragment: createFragmentExtractor(
        'snapshot-task',
        /(?:dataset|Periodic snapshot task)\s+"([^"]+)"/i,
        'snapshot-tasks',
      ),
    },

    ScrubPaused: {
      category: SmartAlertCategory.Storage,
      relatedMenuPath: ['storage'],
      contextualHelp: T('Pool scrub is paused or not running. This may be due to pool being offline or scrub task being manually paused. Check pool status and scheduled scrub configuration.'),
      actions: [
        {
          label: T('View Storage'),
          type: SmartAlertActionType.Navigate,
          icon: iconMarker('dns'),
          route: ['/storage'],
          primary: true,
        },
      ],
    },

    ScrubNotRunning: {
      category: SmartAlertCategory.Storage,
      relatedMenuPath: ['storage'],
      contextualHelp: T('Pool scrub is not running. This may be due to pool being offline or scrub task configuration issues. Check pool status and scheduled scrub configuration.'),
      actions: [
        {
          label: T('View Storage'),
          type: SmartAlertActionType.Navigate,
          icon: iconMarker('dns'),
          route: ['/storage'],
          primary: true,
        },
      ],
    },

    // Applications
    FailuresInAppMigration: {
      category: SmartAlertCategory.Applications,
      relatedMenuPath: ['apps', 'installed'],
      actions: [{
        label: T('Go to Applications'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('apps'),
        route: ['/apps', 'installed'],
        primary: true,
      }],
    },

    AppUpdate: {
      category: SmartAlertCategory.Applications,
      relatedMenuPath: ['apps', 'installed'],
      actions: [{
        label: T('Go to Applications'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('apps'),
        route: ['/apps', 'installed'],
        primary: true,
      }],
    },

    ApplicationsStartFailed: {
      category: SmartAlertCategory.Applications,
      relatedMenuPath: ['apps', 'installed'],
      actions: [{
        label: T('Go to Applications'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('apps'),
        route: ['/apps', 'installed'],
        primary: true,
      }],
    },

    ApplicationsConfigurationFailed: {
      category: SmartAlertCategory.Applications,
      relatedMenuPath: ['apps', 'installed'],
      actions: [{
        label: T('Go to App Settings'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('mdi-cog'),
        route: ['/apps', 'installed'],
        fragment: 'installed',
        primary: true,
      }],
    },

    // Certificates
    CertificateExpired: {
      category: SmartAlertCategory.Security,
      relatedMenuPath: ['credentials', 'certificates'],
      actions: [{
        label: T('Go to Certificates'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('mdi-certificate'),
        route: ['/credentials', 'certificates'],
        primary: true,
      }],
    },

    CertificateIsExpiring: {
      category: SmartAlertCategory.Security,
      relatedMenuPath: ['credentials', 'certificates'],
      actions: [{
        label: T('Go to Certificates'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('mdi-certificate'),
        route: ['/credentials', 'certificates'],
        primary: true,
      }],
    },

    CertificateIsExpiringSoon: {
      category: SmartAlertCategory.Security,
      relatedMenuPath: ['credentials', 'certificates'],
      actions: [{
        label: T('Go to Certificates'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('mdi-certificate'),
        route: ['/credentials', 'certificates'],
        primary: true,
      }],
    },

    CertificateParsingFailed: {
      category: SmartAlertCategory.Security,
      relatedMenuPath: ['credentials', 'certificates'],
      actions: [{
        label: T('Go to Certificates'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('mdi-certificate'),
        route: ['/credentials', 'certificates'],
        primary: true,
      }],
    },

    CertificateRevoked: {
      category: SmartAlertCategory.Security,
      relatedMenuPath: ['credentials', 'certificates'],
      actions: [{
        label: T('Go to Certificates'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('mdi-certificate'),
        route: ['/credentials', 'certificates'],
        primary: true,
      }],
    },

    WebUiCertificateSetupFailed: {
      category: SmartAlertCategory.System,
      relatedMenuPath: ['system', 'general'],
      actions: [{
        label: T('Go to GUI Settings'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('mdi-desktop-classic'),
        route: ['/system', 'general'],
        fragment: 'gui-settings',
        primary: true,
      }],
    },

    WebUiBindAddressV2: {
      category: SmartAlertCategory.System,
      relatedMenuPath: ['system', 'general'],
      actions: [{
        label: T('Go to GUI Settings'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('mdi-desktop-classic'),
        route: ['/system', 'general'],
        fragment: 'gui-settings',
        primary: true,
      }],
    },

    // Directory Services
    ActiveDirectoryDomainBind: {
      category: SmartAlertCategory.Services,
      relatedMenuPath: ['credentials', 'directory-services'],
      documentationUrl: 'https://www.truenas.com/docs/scale/scaletutorials/credentials/directoryservices/configadscale/',
      actions: [{
        label: T('Go To Directory Services'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('mdi-sitemap'),
        route: ['/credentials', 'directory-services'],
        primary: true,
      }],
    },

    ActiveDirectoryDomainHealth: {
      category: SmartAlertCategory.Services,
      relatedMenuPath: ['credentials', 'directory-services'],
      documentationUrl: 'https://www.truenas.com/docs/scale/scaletutorials/credentials/directoryservices/configadscale/',
      actions: [{
        label: T('Go To Directory Services'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('mdi-sitemap'),
        route: ['/credentials', 'directory-services'],
        primary: true,
      }],
    },

    LdapBind: {
      category: SmartAlertCategory.Services,
      relatedMenuPath: ['credentials', 'directory-services'],
      documentationUrl: 'https://www.truenas.com/docs/scale/scaletutorials/credentials/directoryservices/configldapscale/',
      actions: [{
        label: T('Go To Directory Services'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('mdi-sitemap'),
        route: ['/credentials', 'directory-services'],
        primary: true,
      }],
    },

    // Network
    NoCriticalFailoverInterfaceFound: {
      category: SmartAlertCategory.Network,
      relatedMenuPath: ['network'],
      actions: [{
        label: T('Go to Network Interfaces'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('mdi-lan'),
        route: ['/network'],
        primary: true,
      }],
    },

    NetworkCardsMismatchOnActiveNode: {
      category: SmartAlertCategory.Network,
      relatedMenuPath: ['network'],
      actions: [{
        label: T('Go to Network Interfaces'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('mdi-lan'),
        route: ['/network'],
        primary: true,
      }],
    },

    NetworkCardsMismatchOnStandbyNode: {
      category: SmartAlertCategory.Network,
      relatedMenuPath: ['network'],
      actions: [{
        label: T('Go to Network Interfaces'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('mdi-lan'),
        route: ['/network'],
        primary: true,
      }],
    },

    BONDMissingPorts: {
      category: SmartAlertCategory.Network,
      relatedMenuPath: ['network'],
      actions: [{
        label: T('Go to Network Interfaces'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('mdi-lan'),
        route: ['/network'],
        primary: true,
      }],
    },

    BONDInactivePorts: {
      category: SmartAlertCategory.Network,
      relatedMenuPath: ['network'],
      actions: [{
        label: T('Go to Network Interfaces'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('mdi-lan'),
        route: ['/network'],
        primary: true,
      }],
    },

    BONDNoActivePorts: {
      category: SmartAlertCategory.Network,
      relatedMenuPath: ['network'],
      actions: [{
        label: T('Go to Network Interfaces'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('mdi-lan'),
        route: ['/network'],
        primary: true,
      }],
    },

    // Failover
    FailoverSyncFailed: {
      category: SmartAlertCategory.System,
      relatedMenuPath: ['system', 'failover'],
      actions: [{
        label: T('Go to Failover Settings'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('mdi-sync'),
        route: ['/system', 'failover'],
        fragment: 'failover',
        primary: true,
      }],
    },

    FailoverKeysSyncFailed: {
      category: SmartAlertCategory.System,
      relatedMenuPath: ['system', 'failover'],
      actions: [{
        label: T('Go to Failover Settings'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('mdi-sync'),
        route: ['/system', 'failover'],
        fragment: 'failover',
        primary: true,
      }],
    },

    // JBOF
    JBOFRedfishComm: {
      category: SmartAlertCategory.Hardware,
      relatedMenuPath: ['system', 'jbof'],
      actions: [{
        label: T('Go to JBOF'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('mdi-expansion-card'),
        route: ['/system', 'jbof'],
        primary: true,
      }],
    },

    JBOFElementCritical: {
      category: SmartAlertCategory.Hardware,
      relatedMenuPath: ['system', 'jbof'],
      actions: [{
        label: T('Go to JBOF'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('mdi-expansion-card'),
        route: ['/system', 'jbof'],
        primary: true,
      }],
    },

    JBOFElementWarning: {
      category: SmartAlertCategory.Hardware,
      relatedMenuPath: ['system', 'jbof'],
      actions: [{
        label: T('Go to JBOF'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('mdi-expansion-card'),
        route: ['/system', 'jbof'],
        primary: true,
      }],
    },

    JBOFTearDownFailure: {
      category: SmartAlertCategory.Hardware,
      relatedMenuPath: ['system', 'jbof'],
      actions: [{
        label: T('Go to JBOF'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('mdi-expansion-card'),
        route: ['/system', 'jbof'],
        primary: true,
      }],
    },

    JBOFInvalidData: {
      category: SmartAlertCategory.Hardware,
      relatedMenuPath: ['system', 'jbof'],
      actions: [{
        label: T('Go to JBOF'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('mdi-expansion-card'),
        route: ['/system', 'jbof'],
        primary: true,
      }],
    },

    // Disks & SMART
    SMART: {
      category: SmartAlertCategory.Hardware,
      relatedMenuPath: ['storage', 'disks'],
      documentationUrl: 'https://www.truenas.com/docs/scale/scaletutorials/storage/disks/',
      actions: [{
        label: T('Go to Disks'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('mdi-harddisk'),
        route: ['/storage', 'disks'],
        primary: true,
      }],
    },

    Smartd: {
      category: SmartAlertCategory.Services,
      relatedMenuPath: ['system', 'services'],
      actions: [{
        label: T('Go to Services'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('mdi-cog'),
        route: ['/system', 'services'],
        primary: true,
      }],
    },

    // KMIP
    KMIPConnectionFailed: {
      category: SmartAlertCategory.Security,
      relatedMenuPath: ['credentials', 'kmip'],
      documentationUrl: 'https://www.truenas.com/docs/scale/scaletutorials/credentials/configuringkmipscale/',
      actions: [{
        label: T('Go to KMIP'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('mdi-key-variant'),
        route: ['/credentials', 'kmip'],
        primary: true,
      }],
    },

    KMIPSEDGlobalPasswordSyncFailure: {
      category: SmartAlertCategory.Security,
      relatedMenuPath: ['credentials', 'kmip'],
      documentationUrl: 'https://www.truenas.com/docs/scale/scaletutorials/credentials/configuringkmipscale/',
      actions: [{
        label: T('Go to KMIP'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('mdi-key-variant'),
        route: ['/credentials', 'kmip'],
        primary: true,
      }],
    },

    KMIPSEDDisksSyncFailure: {
      category: SmartAlertCategory.Security,
      relatedMenuPath: ['credentials', 'kmip'],
      documentationUrl: 'https://www.truenas.com/docs/scale/scaletutorials/credentials/configuringkmipscale/',
      actions: [{
        label: T('Go to KMIP'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('mdi-key-variant'),
        route: ['/credentials', 'kmip'],
        primary: true,
      }],
    },

    KMIPZFSDatasetsSyncFailure: {
      category: SmartAlertCategory.Security,
      relatedMenuPath: ['credentials', 'kmip'],
      documentationUrl: 'https://www.truenas.com/docs/scale/scaletutorials/credentials/configuringkmipscale/',
      actions: [{
        label: T('Go to KMIP'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('mdi-key-variant'),
        route: ['/credentials', 'kmip'],
        primary: true,
      }],
    },

    // NFS
    NFSBindAddress: {
      category: SmartAlertCategory.Services,
      relatedMenuPath: ['system', 'services'],
      documentationUrl: 'https://www.truenas.com/docs/scale/scaletutorials/systemsettings/services/nfsservicescale/',
      actions: [{
        label: T('Go to NFS Service'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('mdi-folder-network'),
        route: ['/system', 'services'],
        fragment: 'nfs',
        primary: true,
      }],
    },

    // SMB
    SMBPath: {
      category: SmartAlertCategory.Services,
      relatedMenuPath: ['sharing', 'smb'],
      documentationUrl: 'https://www.truenas.com/docs/scale/scaletutorials/shares/smb/managesmbshares/',
      actions: [{
        label: T('Go to SMB shares'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('mdi-folder-network'),
        route: ['/sharing', 'smb'],
        primary: true,
      }],
    },

    SMBLegacyProtocol: {
      category: SmartAlertCategory.Services,
      relatedMenuPath: ['sharing', 'smb'],
      documentationUrl: 'https://www.truenas.com/docs/scale/scaletutorials/systemsettings/services/smbservicescale/',
      actions: [{
        label: T('Go to SMB sessions'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('mdi-folder-network'),
        route: ['/sharing', 'smb', 'status', 'sessions'],
        primary: true,
      }],
    },

    // Datasets
    ShareLocked: {
      category: SmartAlertCategory.Storage,
      relatedMenuPath: ['datasets'],
      actions: [{
        label: T('Go to Datasets'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('mdi-database'),
        route: ['/datasets'],
        primary: true,
      }],
    },

    QuotaCritical: {
      category: SmartAlertCategory.Storage,
      relatedMenuPath: ['datasets'],
      documentationUrl: 'https://www.truenas.com/docs/scale/scaletutorials/datasets/managequotas/',
      actions: [{
        label: T('Go to Datasets'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('mdi-database'),
        route: ['/datasets'],
        primary: true,
      }],
    },

    QuotaWarning: {
      category: SmartAlertCategory.Storage,
      relatedMenuPath: ['datasets'],
      documentationUrl: 'https://www.truenas.com/docs/scale/scaletutorials/datasets/managequotas/',
      actions: [{
        label: T('Go to Datasets'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('mdi-database'),
        route: ['/datasets'],
        primary: true,
      }],
    },

    EncryptedDataset: {
      category: SmartAlertCategory.Storage,
      relatedMenuPath: ['datasets'],
      actions: [{
        label: T('Go to Datasets'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('mdi-database'),
        route: ['/datasets'],
        primary: true,
      }],
    },

    TaskLocked: {
      category: SmartAlertCategory.Storage,
      relatedMenuPath: ['datasets'],
      actions: [{
        label: T('Go to Datasets'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('mdi-database'),
        route: ['/datasets'],
        primary: true,
      }],
    },

    // Storage/Pools
    PoolUpgraded: {
      category: SmartAlertCategory.Storage,
      relatedMenuPath: ['storage'],
      actions: [{
        label: T('Go to Storage'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('dns'),
        route: ['/storage'],
        primary: true,
      }],
    },

    ZpoolCapacityCritical: {
      conditions: [
        {
          // Boot pool capacity - direct to Boot Environments management
          check: (alert: Alert) => isBootPoolAlert(alert.args),
          enhancement: {
            category: SmartAlertCategory.System,
            relatedMenuPath: ['system', 'boot'],
            contextualHelp: T('Boot pool capacity is critically high. Clean up old boot environments to free up space and prevent system issues.'),
            documentationUrl: 'https://www.truenas.com/docs/scale/scaletutorials/systemsettings/boot/managingbootenvironments/',
            actions: [{
              label: T('Manage Boot Environments'),
              type: SmartAlertActionType.Navigate,
              icon: iconMarker('mdi-layers'),
              route: bootListElements.anchorRouterLink,
              primary: true,
            }, {
              label: T('Boot Environments Guide'),
              type: SmartAlertActionType.ExternalLink,
              icon: iconMarker('mdi-book-open-variant'),
              externalUrl: 'https://www.truenas.com/docs/scale/scaletutorials/systemsettings/boot/managingbootenvironments/',
            }],
          },
        },
      ],
      defaultEnhancement: {
        // Regular data pool capacity - direct to Storage
        category: SmartAlertCategory.Storage,
        relatedMenuPath: ['storage'],
        contextualHelp: T('Storage pool capacity is critically high. Consider expanding capacity or cleaning up old data.'),
        actions: [{
          label: T('Go to Storage'),
          type: SmartAlertActionType.Navigate,
          icon: iconMarker('dns'),
          route: ['/storage'],
          primary: true,
        }],
      },
    } satisfies ConditionalSmartAlertEnhancement,

    ZpoolCapacityWarning: {
      conditions: [
        {
          // Boot pool capacity - direct to Boot Environments management
          check: (alert: Alert) => isBootPoolAlert(alert.args),
          enhancement: {
            category: SmartAlertCategory.System,
            relatedMenuPath: ['system', 'boot'],
            contextualHelp: T('Boot pool capacity is high. Consider cleaning up old boot environments to free up space.'),
            documentationUrl: 'https://www.truenas.com/docs/scale/scaletutorials/systemsettings/boot/managingbootenvironments/',
            actions: [{
              label: T('Manage Boot Environments'),
              type: SmartAlertActionType.Navigate,
              icon: iconMarker('mdi-layers'),
              route: bootListElements.anchorRouterLink,
              primary: true,
            }, {
              label: T('Boot Environments Guide'),
              type: SmartAlertActionType.ExternalLink,
              icon: iconMarker('mdi-book-open-variant'),
              externalUrl: 'https://www.truenas.com/docs/scale/scaletutorials/systemsettings/boot/managingbootenvironments/',
            }],
          },
        },
      ],
      defaultEnhancement: {
        // Regular data pool capacity - direct to Storage
        category: SmartAlertCategory.Storage,
        relatedMenuPath: ['storage'],
        contextualHelp: T('Storage pool capacity is high. Monitor usage and consider expanding capacity.'),
        actions: [{
          label: T('Go to Storage'),
          type: SmartAlertActionType.Navigate,
          icon: iconMarker('dns'),
          route: ['/storage'],
          primary: true,
        }],
      },
    } satisfies ConditionalSmartAlertEnhancement,

    ZpoolCapacityNotice: {
      conditions: [
        {
          // Boot pool capacity - direct to Boot Environments management
          check: (alert: Alert) => isBootPoolAlert(alert.args),
          enhancement: {
            category: SmartAlertCategory.System,
            relatedMenuPath: ['system', 'boot'],
            contextualHelp: T('Boot pool usage is increasing. Consider reviewing and cleaning up old boot environments.'),
            documentationUrl: 'https://www.truenas.com/docs/scale/scaletutorials/systemsettings/boot/managingbootenvironments/',
            actions: [{
              label: T('Manage Boot Environments'),
              type: SmartAlertActionType.Navigate,
              icon: iconMarker('mdi-layers'),
              route: bootListElements.anchorRouterLink,
              primary: true,
            }, {
              label: T('Boot Environments Guide'),
              type: SmartAlertActionType.ExternalLink,
              icon: iconMarker('mdi-book-open-variant'),
              externalUrl: 'https://www.truenas.com/docs/scale/scaletutorials/systemsettings/boot/managingbootenvironments/',
            }],
          },
        },
      ],
      defaultEnhancement: {
        // Regular data pool capacity - direct to Storage
        category: SmartAlertCategory.Storage,
        relatedMenuPath: ['storage'],
        contextualHelp: T('Storage pool usage is increasing. Monitor capacity trends.'),
        actions: [{
          label: T('Go to Storage'),
          type: SmartAlertActionType.Navigate,
          icon: iconMarker('dns'),
          route: ['/storage'],
          primary: true,
        }],
      },
    } satisfies ConditionalSmartAlertEnhancement,

    VolumeStatus: {
      category: SmartAlertCategory.Storage,
      relatedMenuPath: ['storage'],
      extractApiParams: (alert: { args: unknown }) => {
        // Extract pool ID from alert args for dynamic routing to VDEVs page
        if (alert.args && typeof alert.args === 'object' && 'id' in alert.args) {
          return { poolId: (alert.args as { id: number }).id };
        }
        return undefined;
      },
      actions: [{
        label: T('View VDEVs'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('dns'),
        route: ['/storage', routePlaceholders.poolId, 'vdevs'],
        primary: true,
      }],
    },

    PoolUsbDisks: {
      category: SmartAlertCategory.Storage,
      relatedMenuPath: ['storage'],
      actions: [{
        label: T('Go to Storage'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('dns'),
        route: ['/storage'],
        primary: true,
      }],
    },

    // Snapshots
    SnapshotTotalCount: {
      category: SmartAlertCategory.Storage,
      relatedMenuPath: ['datasets'],
      actions: [{
        label: T('Go to Snapshots'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('mdi-camera'),
        route: ['/datasets'],
        primary: true,
      }],
    },

    SnapshotCount: {
      category: SmartAlertCategory.Storage,
      relatedMenuPath: ['datasets'],
      actions: [{
        label: T('Go to Snapshots'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('mdi-camera'),
        route: ['/datasets'],
        primary: true,
      }],
    },

    // API Keys
    ApiKeyRevoked: {
      category: SmartAlertCategory.Security,
      relatedMenuPath: ['credentials', 'users'],
      actions: [{
        label: T('Go to API keys'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('mdi-key'),
        route: ['/credentials', 'users'],
        primary: true,
      }],
    },

    APIFailedLogin: {
      category: SmartAlertCategory.Security,
      relatedMenuPath: ['credentials', 'users'],
      actions: [{
        label: T('Go to API keys'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('mdi-key'),
        route: ['/credentials', 'users'],
        primary: true,
      }],
    },

    // Boot Pool
    BootPoolStatus: {
      category: SmartAlertCategory.System,
      relatedMenuPath: ['system', 'boot'],
      actions: [{
        label: T('Go to Boot Pools'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('mdi-layers'),
        route: ['/system', 'boot'],
        primary: true,
      }],
    },

    // License - already covered by LicenseStatus source but adding class mappings
    LicenseHasExpired: {
      category: SmartAlertCategory.System,
      relatedMenuPath: ['system', 'general'],
      actions: [{
        label: T('Go to System Settings'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('settings'),
        route: ['/system', 'general'],
        fragment: 'support',
        primary: true,
      }],
    },

    LicenseIsExpiring: {
      category: SmartAlertCategory.System,
      relatedMenuPath: ['system', 'general'],
      actions: [{
        label: T('Go to System Settings'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('settings'),
        route: ['/system', 'general'],
        fragment: 'support',
        primary: true,
      }],
    },

    License: {
      category: SmartAlertCategory.System,
      relatedMenuPath: ['system', 'general'],
      actions: [{
        label: T('Go to System Settings'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('settings'),
        route: ['/system', 'general'],
        fragment: 'support',
        primary: true,
      }],
    },

    ProactiveSupport: {
      category: SmartAlertCategory.System,
      relatedMenuPath: ['system', 'general'],
      actions: [{
        label: T('Go to System Settings'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('settings'),
        route: ['/system', 'general'],
        fragment: 'support',
        primary: true,
      }],
    },

    // System Updates
    HasUpdate: {
      category: SmartAlertCategory.System,
      relatedMenuPath: ['system', 'update'],
      actions: [{
        label: T('Go to System Updates'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('mdi-update'),
        route: ['/system', 'update'],
        primary: true,
      }],
    },

    // Data Protection - already have CloudBackupTaskFailed, CloudSyncTaskFailed, ReplicationFailed
    ReplicationSuccess: {
      category: SmartAlertCategory.Tasks,
      relatedMenuPath: ['data-protection', 'replication'],
      actions: [{
        label: T('Go to Data Protection'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('security'),
        route: ['/data-protection'],
        primary: true,
      }],
    },

    ScrubFinished: {
      category: SmartAlertCategory.Storage,
      relatedMenuPath: ['storage'],
      actions: [{
        label: T('Go to Data Protection'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('security'),
        route: ['/data-protection'],
        primary: true,
      }],
    },

    ScrubNotStarted: {
      category: SmartAlertCategory.Storage,
      relatedMenuPath: ['storage'],
      actions: [{
        label: T('Go to Data Protection'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('security'),
        route: ['/data-protection'],
        primary: true,
      }],
    },

    // VMware Snapshots
    VMWareLoginFailed: {
      category: SmartAlertCategory.Tasks,
      relatedMenuPath: ['data-protection', 'vmware-snapshots'],
      documentationUrl: 'https://www.truenas.com/docs/scale/scaletutorials/dataprotection/creatingvmwaresnapshots/',
      actions: [{
        label: T('Go to VMWare Snapshots'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('mdi-camera'),
        route: ['/data-protection', 'vmware-snapshots'],
        primary: true,
      }],
    },

    VMWareSnapshotDeleteFailed: {
      category: SmartAlertCategory.Tasks,
      relatedMenuPath: ['data-protection', 'vmware-snapshots'],
      documentationUrl: 'https://www.truenas.com/docs/scale/scaletutorials/dataprotection/creatingvmwaresnapshots/',
      actions: [{
        label: T('Go to VMWare Snapshots'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('mdi-camera'),
        route: ['/data-protection', 'vmware-snapshots'],
        primary: true,
      }],
    },

    VMWareSnapshotCreateFailed: {
      category: SmartAlertCategory.Tasks,
      relatedMenuPath: ['data-protection', 'vmware-snapshots'],
      documentationUrl: 'https://www.truenas.com/docs/scale/scaletutorials/dataprotection/creatingvmwaresnapshots/',
      actions: [{
        label: T('Go to VMWare Snapshots'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('mdi-camera'),
        route: ['/data-protection', 'vmware-snapshots'],
        primary: true,
      }],
    },

    // UPS
    UPSCommbad: {
      category: SmartAlertCategory.Hardware,
      relatedMenuPath: ['system', 'services'],
      documentationUrl: 'https://www.truenas.com/docs/scale/scaletutorials/systemsettings/services/upsservicesscale/',
      actions: [{
        label: T('Go to UPS service'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('mdi-flash'),
        route: ['/system', 'services'],
        fragment: 'ups',
        primary: true,
      }],
    },
  },

  byLevel: {
    // Default actions for all alerts of a certain level
    // These are applied if no specific source/class match is found
  },
};

/**
 * Pattern-based categorization rules for alerts without explicit source/class mappings
 * Order matters: more specific patterns should come first
 */
const patternCategories: {
  patterns: RegExp[];
  category: SmartAlertCategory;
  relatedMenuPath?: string[];
  actions?: SmartAlertAction[];
}[] = [
  // Storage issues - pool offline, degraded, scrub issues
  {
    patterns: [/pool.*offline/i, /pool.*degraded/i, /pool.*unavailable/i, /disk.*fail/i, /vdev.*fail/i, /scrub/i],
    category: SmartAlertCategory.Storage,
    relatedMenuPath: ['storage'],
    actions: [
      {
        label: T('View Storage'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('dns'),
        route: ['/storage'],
        primary: true,
      },
    ],
  },
  // Root account usage
  {
    patterns: [/root.*account.*authenticate/i, /default.*administrator.*account/i, /root.*login/i],
    category: SmartAlertCategory.Security,
    relatedMenuPath: ['credentials', 'users'],
    actions: [
      {
        label: T('Manage Users'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('mdi-account-multiple'),
        route: ['/credentials', 'users'],
        primary: true,
      },
    ],
  },
  // NVDIMM hardware issues
  {
    patterns: [/nvdimm/i, /nmem\d+/i],
    category: SmartAlertCategory.Hardware,
    relatedMenuPath: ['system', 'viewenclosure'],
    actions: [
      {
        label: T('View Enclosure'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('mdi-server'),
        route: ['/system', 'viewenclosure'],
        primary: true,
      },
      {
        label: T('Contact Support'),
        type: SmartAlertActionType.ExternalLink,
        icon: iconMarker('mdi-help-circle'),
        externalUrl: 'https://support.ixsystems.com',
      },
    ],
  },
  // Certificate issues
  {
    patterns: [/certificate.*expir/i, /certificate.*invalid/i, /ssl/i, /tls/i],
    category: SmartAlertCategory.Security,
    relatedMenuPath: ['credentials', 'certificates'],
    actions: [
      {
        label: T('Renew Certificate'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('mdi-certificate'),
        route: ['/credentials', 'certificates'],
        primary: true,
      },
    ],
  },
  // Network issues
  {
    patterns: [/network/i, /interface.*down/i, /ipmi/i, /ethernet/i],
    category: SmartAlertCategory.Network,
    relatedMenuPath: ['system', 'network'],
    actions: [
      {
        label: T('Go to Network'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('mdi-network'),
        route: ['/system', 'network'],
        primary: true,
      },
    ],
  },
  // Service issues
  {
    patterns: [/service.*fail/i, /service.*stop/i, /daemon/i],
    category: SmartAlertCategory.Services,
    relatedMenuPath: ['system', 'services'],
    actions: [
      {
        label: T('View Services'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('settings'),
        route: ['/system', 'services'],
        primary: true,
      },
    ],
  },
  // Application issues and updates
  {
    patterns: [/app.*fail/i, /container/i, /kubernetes/i, /docker/i, /updates are available for \d+ application/i],
    category: SmartAlertCategory.Applications,
    relatedMenuPath: ['apps', 'installed'],
    actions: [
      {
        label: T('View Applications'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('apps'),
        route: ['/apps', 'installed'],
        primary: true,
      },
    ],
  },
  // Task issues - backup, replication, snapshot, sync (scrub handled separately above)
  {
    patterns: [/backup.*fail/i, /replication.*fail/i, /snapshot/i, /sync.*fail/i],
    category: SmartAlertCategory.Tasks,
    relatedMenuPath: ['data-protection'],
    actions: [
      {
        label: T('View Data Protection'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('security'),
        route: ['/data-protection'],
        primary: true,
      },
    ],
  },
  // System updates (specific pattern to avoid matching application updates)
  {
    patterns: [/(system|truenas).*update/i, /upgrade/i, /new version/i],
    category: SmartAlertCategory.System,
    relatedMenuPath: ['system', 'update'],
    actions: [
      {
        label: T('View Updates'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('mdi-update'),
        route: ['/system', 'update'],
        primary: true,
      },
    ],
  },
  // Hardware issues
  {
    patterns: [/hardware/i, /enclosure/i, /temperature/i, /fan/i, /power supply/i, /ups/i],
    category: SmartAlertCategory.Hardware,
    relatedMenuPath: ['system', 'viewenclosure'],
    actions: [
      {
        label: T('View Enclosure'),
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('mdi-server'),
        route: ['/system', 'viewenclosure'],
        primary: true,
      },
    ],
  },
];

/**
 * Helper function to get enhancement for an alert
 *
 * @param source - Alert source
 * @param klass - Alert class name
 * @param alertText - Alert message text
 * @param alert - Full alert object (required for conditional enhancements)
 * @returns Resolved enhancement or null if no match found
 */
export function getAlertEnhancement(
  source: string,
  klass?: string,
  alertText?: string,
  alert?: Alert,
): SmartAlertEnhancement | null {
  let enhancement: SmartAlertEnhancement | ConditionalSmartAlertEnhancement | null = null;

  // Try to match by source first
  if (smartAlertRegistry.bySource?.[source]) {
    enhancement = smartAlertRegistry.bySource[source];
  }

  // Try to match by class
  if (!enhancement && klass && smartAlertRegistry.byClass?.[klass]) {
    enhancement = smartAlertRegistry.byClass[klass];
  }

  // Fallback: try pattern-based categorization
  // Pattern matches provide category, path, and optional default actions
  if (!enhancement && alertText) {
    for (const rule of patternCategories) {
      if (rule.patterns.some((pattern) => pattern.test(alertText))) {
        enhancement = {
          category: rule.category,
          relatedMenuPath: rule.relatedMenuPath,
          actions: rule.actions || [],
        };
        break;
      }
    }
  }

  // If no enhancement found, return null
  if (!enhancement) {
    return null;
  }

  // Resolve conditional enhancements if alert is provided
  if (isConditionalEnhancement(enhancement)) {
    if (!alert) {
      console.warn('Conditional enhancement found but no alert object provided. Using default enhancement.');
      return enhancement.defaultEnhancement;
    }
    return resolveConditionalEnhancement(enhancement, alert);
  }

  return enhancement;
}
