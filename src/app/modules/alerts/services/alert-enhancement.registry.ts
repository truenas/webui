import { isDevMode } from '@angular/core';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { tnIconMarker } from '@truenas/ui-components';
import { AlertClassName } from 'app/enums/alert-class-name.enum';
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
import { isBootPoolAlert } from 'app/modules/alerts/utils/boot-pool.utils';
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
      documentationUrl: 'https://www.truenas.com/docs/scale/systemsettings/general/addlicenseproactivesupport/',
      actions: [
        {
          label: T('Manage License'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('license', 'mdi'),
          route: ['/system', 'general'],
          fragment: 'support',
          primary: true,
        },
        {
          label: T('Contact Support'),
          type: SmartAlertActionType.ExternalLink,
          icon: tnIconMarker('help-circle', 'mdi'),
          externalUrl: 'https://support.ixsystems.com',
        },
        {
          label: T('View Documentation'),
          type: SmartAlertActionType.ExternalLink,
          icon: tnIconMarker('book-open-variant', 'mdi'),
          externalUrl: 'https://www.truenas.com/docs/scale/systemsettings/general/addlicenseproactivesupport/',
        },
      ],
    },

    ProactiveSupport: {
      category: SmartAlertCategory.System,
      relatedMenuPath: ['system', 'general'],
      contextualHelp: T('Proactive Support helps iXsystems monitor your system health and provide early warnings. Configuration takes just a few minutes.'),
      documentationUrl: 'https://www.truenas.com/docs/scale/systemsettings/general/addlicenseproactivesupport/',
      actions: [
        {
          label: T('Configure Support'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('cog', 'mdi'),
          route: ['/system', 'general'],
          fragment: 'support',
          primary: true,
        },
        {
          label: T('Learn More'),
          type: SmartAlertActionType.ExternalLink,
          icon: tnIconMarker('information', 'mdi'),
          externalUrl: 'https://www.truenas.com/docs/scale/systemsettings/general/addlicenseproactivesupport/',
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
          icon: tnIconMarker('license', 'mdi'),
          route: ['/system', 'general'],
          fragment: 'support',
          primary: true,
        },
        {
          label: T('Contact Support'),
          type: SmartAlertActionType.ExternalLink,
          icon: tnIconMarker('help-circle', 'mdi'),
          externalUrl: 'https://support.ixsystems.com',
        },
        {
          label: T('View Documentation'),
          type: SmartAlertActionType.ExternalLink,
          icon: tnIconMarker('book-open-variant', 'mdi'),
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
      documentationUrl: 'https://www.truenas.com/docs/scale/credentials/certificates/certificatesscale/',
      actions: [
        {
          label: T('Renew Certificate'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('certificate', 'mdi'),
          route: ['/credentials', 'certificates'],
          primary: true,
        },
        {
          label: T('Certificate Guide'),
          type: SmartAlertActionType.ExternalLink,
          icon: tnIconMarker('book-open-variant', 'mdi'),
          externalUrl: 'https://www.truenas.com/docs/scale/credentials/certificates/certificatesscale/',
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
      documentationUrl: 'https://www.truenas.com/docs/scale/credentials/managelocalusersscale/',
      actions: [
        {
          label: T('Manage Users'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('account-multiple', 'mdi'),
          route: ['/credentials', 'users'],
          primary: true,
        },
        {
          label: T('User Management Guide'),
          type: SmartAlertActionType.ExternalLink,
          icon: tnIconMarker('book-open-variant', 'mdi'),
          externalUrl: 'https://www.truenas.com/docs/scale/credentials/managelocalusersscale/',
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
          icon: tnIconMarker('security', 'material'),
          route: ['/system', 'advanced'],
          primary: true,
        },
        {
          label: T('Restart System'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('restart', 'mdi'),
          route: ['/system-tasks', 'restart'],
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
          icon: tnIconMarker('server', 'mdi'),
          route: ['/system', 'viewenclosure'],
          primary: true,
        },
        {
          label: T('Contact Support'),
          type: SmartAlertActionType.ExternalLink,
          icon: tnIconMarker('help-circle', 'mdi'),
          externalUrl: 'https://support.ixsystems.com',
        },
      ],
    },

    /**
     * Storage and Pool Alerts
     */
    [AlertClassName.VolumeStatus]: {
      category: SmartAlertCategory.Storage,
      relatedMenuPath: ['storage'],
      groupSummary: T('{count, plural, other {# pools are not healthy}}'),
      contextualHelp: T('Storage pool health is critical for data integrity. Investigate and resolve pool issues immediately to prevent data loss.'),
      detailedHelp: T('Common pool issues include: degraded pools (missing/failed drives), scrub errors, capacity warnings, and replication problems.'),
      documentationUrl: 'https://www.truenas.com/docs/scale/storage/managepoolsscale/',
      extractApiParams: () => {
        // VolumeStatus alerts only provide pool name in args.volume, not pool ID
        // Since we can't synchronously resolve pool name to ID, navigate to storage dashboard instead
        return undefined;
      },
      actions: [
        {
          label: T('View Storage'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('database', 'mdi'),
          route: ['/storage'],
          primary: true,
        },
        {
          label: T('Managing Pools Guide'),
          type: SmartAlertActionType.ExternalLink,
          icon: tnIconMarker('book-open-variant', 'mdi'),
          externalUrl: 'https://www.truenas.com/docs/scale/storage/managepoolsscale/',
        },
        {
          label: T('Storage Documentation'),
          type: SmartAlertActionType.ExternalLink,
          icon: tnIconMarker('help-circle', 'mdi'),
          externalUrl: 'https://www.truenas.com/docs/scale/storage/',
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
          icon: tnIconMarker('database', 'mdi'),
          route: ['/storage'],
          primary: true,
        },
        {
          label: T('Managing Pools Guide'),
          type: SmartAlertActionType.ExternalLink,
          icon: tnIconMarker('book-open-variant', 'mdi'),
          externalUrl: 'https://www.truenas.com/docs/scale/storage/managepoolsscale/',
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
      documentationUrl: 'https://www.truenas.com/docs/scale/network/',
      actions: [
        {
          label: T('Configure IPMI'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('lan', 'mdi'),
          route: ['/system', 'network'],
          fragment: 'ipmi',
          primary: true,
        },
        {
          label: T('Network Settings'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('network', 'mdi'),
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
      groupSummary: T('{count, plural, other {# services are not running}}'),
      contextualHelp: T('Service failures can interrupt critical functionality. Review service logs and configuration to identify the cause.'),
      actions: [
        {
          label: T('View Services'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('cog', 'mdi'),
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
      documentationUrl: 'https://www.truenas.com/docs/scale/apps/',
      actions: [
        {
          label: T('View Applications'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('application', 'mdi'),
          route: ['/apps', 'installed'],
          primary: true,
        },
        {
          label: T('App Troubleshooting'),
          type: SmartAlertActionType.ExternalLink,
          icon: tnIconMarker('book-open-variant', 'mdi'),
          externalUrl: 'https://www.truenas.com/docs/scale/apps/',
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
      documentationUrl: 'https://www.truenas.com/docs/scale/gettingstarted/upgrades/',
      actions: [
        {
          label: T('Check for Updates'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('update', 'mdi'),
          route: ['/system', 'update'],
          primary: true,
        },
        {
          label: T('Release Notes'),
          type: SmartAlertActionType.ExternalLink,
          icon: tnIconMarker('note-text', 'mdi'),
          externalUrl: 'https://www.truenas.com/docs/scale/gettingstarted/scalereleasenotes/',
        },
      ],
    },

    ScrubTaskFailed: {
      category: SmartAlertCategory.Storage,
      relatedMenuPath: ['storage'],
      groupSummary: T('{count, plural, other {Scrub failed on # pools}}'),
      contextualHelp: T('Scrub failures may indicate disk errors or pool corruption. Investigate pool health and scheduled scrub tasks immediately.'),
      actions: [
        {
          label: T('View Storage'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('dns', 'material'),
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
          icon: tnIconMarker('server', 'mdi'),
          route: ['/system', 'viewenclosure'],
          primary: true,
        },
        {
          label: T('Contact Support'),
          type: SmartAlertActionType.ExternalLink,
          icon: tnIconMarker('help-circle', 'mdi'),
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
          icon: tnIconMarker('flash', 'mdi'),
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
    [AlertClassName.CloudBackupTaskFailed]: {
      category: SmartAlertCategory.Tasks,
      relatedMenuPath: ['data-protection', 'cloud-backup'],
      groupSummary: T('{count, plural, other {# cloud backup tasks failed}}'),
      contextualHelp: T('Cloud backup failures may be caused by network connectivity issues, insufficient cloud storage space, invalid credentials, or expired authentication tokens.'),
      documentationUrl: 'https://www.truenas.com/docs/scale/dataprotection/truecloud/truecloudtasks/',
      actions: [
        {
          label: T('Rerun Cloud Backup'),
          type: SmartAlertActionType.RunTask,
          icon: tnIconMarker('play-circle', 'mdi'),
          apiMethod: 'cloud_backup.sync',
          primary: true,
          requiresConfirmation: true,
        },
        {
          label: T('View Cloud Backup'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('cloud-upload', 'mdi'),
          route: ['/data-protection', 'cloud-backup'],
        },
        {
          label: T('Check Credentials'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('key', 'mdi'),
          route: ['/credentials', 'backup-credentials'],
        },
        {
          label: T('Backup Documentation'),
          type: SmartAlertActionType.ExternalLink,
          icon: tnIconMarker('book-open-variant', 'mdi'),
          externalUrl: 'https://www.truenas.com/docs/scale/dataprotection/truecloud/truecloudtasks/',
        },
      ],
      extractFragment: createFragmentExtractor(
        'cloud-backup',
        /Cloud\s+Backup(?:\s+Task)?\s+"([^"]+)"/i,
        'cloud-backup-tasks',
      ),
      extractApiParams: createTaskIdExtractor(),
    },

    [AlertClassName.CloudSyncTaskFailed]: {
      category: SmartAlertCategory.Tasks,
      relatedMenuPath: ['data-protection', 'cloudsync'],
      groupSummary: T('{count, plural, other {# cloud sync tasks failed}}'),
      contextualHelp: T('Cloud sync failures may be due to network issues, credential problems, or cloud provider limitations.'),
      documentationUrl: 'https://www.truenas.com/docs/scale/dataprotection/cloudsynctasks/',
      actions: [
        {
          label: T('Rerun Cloud Sync'),
          type: SmartAlertActionType.RunTask,
          icon: tnIconMarker('play-circle', 'mdi'),
          apiMethod: 'cloudsync.sync',
          primary: true,
          requiresConfirmation: true,
        },
        {
          label: T('View Cloud Sync'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('cloud-sync', 'mdi'),
          route: ['/data-protection', 'cloudsync'],
        },
      ],
      extractFragment: createFragmentExtractor(
        'cloudsync-task',
        /Cloud\s+Sync(?:\s+Task)?\s+"([^"]+)"/i,
      ),
      extractApiParams: createTaskIdExtractor(),
    },

    [AlertClassName.ReplicationFailed]: {
      category: SmartAlertCategory.Tasks,
      relatedMenuPath: ['data-protection', 'replication'],
      groupSummary: T('{count, plural, other {# replication tasks failed}}'),
      contextualHelp: T('Replication failures can cause backup gaps. Check network connectivity and destination system health.'),
      documentationUrl: 'https://www.truenas.com/docs/scale/dataprotection/replication/',
      actions: [
        {
          label: T('View Replication'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('sync', 'mdi'),
          route: ['/data-protection', 'replication'],
          primary: true,
        },
      ],
      extractFragment: createFragmentExtractor(
        'replication-task',
        /Replication\s+"([^"]+)"/i,
        undefined,
        // HTML IDs can only contain letters, digits, hyphens, underscores, and periods
        // Remove all invalid characters (spaces, slashes, etc.) to match browser normalization
        // e.g., 'tank - sed' → 'tank-sed', 'z - /mnt' → 'z-mnt'
        (value) => value.replace(/[^a-zA-Z0-9-_.]/g, ''),
      ),
    },

    [AlertClassName.RsyncFailed]: {
      category: SmartAlertCategory.Tasks,
      relatedMenuPath: ['data-protection', 'rsync'],
      groupSummary: T('{count, plural, other {# rsync tasks failed}}'),
      contextualHelp: T('Rsync task failures may be due to connectivity issues, permission problems, or incorrect paths.'),
      documentationUrl: 'https://www.truenas.com/docs/scale/dataprotection/rsynctasksscale/',
      actions: [
        {
          label: T('Rerun Rsync Task'),
          type: SmartAlertActionType.RunTask,
          icon: tnIconMarker('play-circle', 'mdi'),
          apiMethod: 'rsynctask.run',
          primary: true,
          requiresConfirmation: true,
        },
        {
          label: T('View Rsync Tasks'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('sync', 'mdi'),
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

    [AlertClassName.SnapshotFailed]: {
      category: SmartAlertCategory.Tasks,
      relatedMenuPath: ['data-protection', 'snapshot'],
      groupSummary: T('{count, plural, other {# snapshot tasks failed}}'),
      contextualHelp: T('Snapshot failures may indicate storage issues or misconfigured retention policies. Snapshot tasks run automatically on schedule and cannot be manually triggered.'),
      actions: [
        {
          label: T('View Snapshot Tasks'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('camera', 'mdi'),
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

    [AlertClassName.ScrubPaused]: {
      category: SmartAlertCategory.Storage,
      relatedMenuPath: ['storage'],
      groupSummary: T('Scrub is paused on {count, plural, other {# pools}}'),
      contextualHelp: T('Pool scrub is paused or not running. This may be due to pool being offline or scrub task being manually paused. Check pool status and scheduled scrub configuration.'),
      actions: [
        {
          label: T('View Storage'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('dns', 'material'),
          route: ['/storage'],
          primary: true,
        },
      ],
    },

    ScrubNotRunning: {
      category: SmartAlertCategory.Storage,
      relatedMenuPath: ['storage'],
      groupSummary: T('Scrub is not running on {count, plural, other {# pools}}'),
      contextualHelp: T('Pool scrub is not running. This may be due to pool being offline or scrub task configuration issues. Check pool status and scheduled scrub configuration.'),
      actions: [
        {
          label: T('View Storage'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('dns', 'material'),
          route: ['/storage'],
          primary: true,
        },
      ],
    },

    // Audit
    [AlertClassName.AuditBackendSetup]: {
      category: SmartAlertCategory.System,
      relatedMenuPath: ['system', 'audit'],
      contextualHelp: T('The audit service could not start its storage backend, so no audit records are being written.'),
      actions: [
        {
          label: T('Go to Audit'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('clipboard-text', 'mdi'),
          route: ['/system', 'audit'],
          primary: true,
        },
      ],
    },

    [AlertClassName.AuditServiceHealth]: {
      category: SmartAlertCategory.System,
      relatedMenuPath: ['system', 'audit'],
      contextualHelp: T('The audit service failed a health check. Audit records may be incomplete until it recovers.'),
      actions: [
        {
          label: T('Go to Audit'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('clipboard-text', 'mdi'),
          route: ['/system', 'audit'],
          primary: true,
        },
      ],
    },

    [AlertClassName.AuditDatabaseCorrupted]: {
      category: SmartAlertCategory.System,
      relatedMenuPath: ['system', 'audit'],
      contextualHelp: T('The audit database contains corrupted records. Export what you need and contact support before the damaged rows are pruned.'),
      actions: [
        {
          label: T('Go to Audit'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('clipboard-text', 'mdi'),
          route: ['/system', 'audit'],
          primary: true,
        },
        {
          label: T('Contact Support'),
          type: SmartAlertActionType.ExternalLink,
          icon: tnIconMarker('help-circle', 'mdi'),
          externalUrl: 'https://support.ixsystems.com',
        },
      ],
    },

    [AlertClassName.TrueNasVerifyServiceChangeDetection]: {
      category: SmartAlertCategory.Security,
      contextualHelp: T('The verify service found files in the root filesystem that differ from the shipped image. Unexpected changes there should be investigated.'),
      actions: [
        {
          label: T('Contact Support'),
          type: SmartAlertActionType.ExternalLink,
          icon: tnIconMarker('help-circle', 'mdi'),
          externalUrl: 'https://support.ixsystems.com',
          primary: true,
        },
      ],
    },

    // Applications
    [AlertClassName.FailuresInAppMigration]: {
      category: SmartAlertCategory.Applications,
      relatedMenuPath: ['apps', 'installed'],
      actions: [{
        label: T('Go to Applications'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('apps', 'material'),
        route: ['/apps', 'installed'],
        primary: true,
      }],
    },

    [AlertClassName.AppUpdate]: {
      category: SmartAlertCategory.Applications,
      relatedMenuPath: ['apps', 'installed'],
      groupSummary: T('{count, plural, other {Updates are available for # applications}}'),
      actions: [{
        label: T('Go to Applications'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('apps', 'material'),
        route: ['/apps', 'installed'],
        primary: true,
      }],
    },

    [AlertClassName.ApplicationsStartFailed]: {
      category: SmartAlertCategory.Applications,
      relatedMenuPath: ['apps', 'installed'],
      groupSummary: T('{count, plural, other {# applications failed to start}}'),
      actions: [{
        label: T('Go to Applications'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('apps', 'material'),
        route: ['/apps', 'installed'],
        primary: true,
      }],
    },

    [AlertClassName.ApplicationsConfigurationFailed]: {
      category: SmartAlertCategory.Applications,
      relatedMenuPath: ['apps', 'installed'],
      groupSummary: T('{count, plural, other {# applications could not be configured}}'),
      actions: [{
        label: T('Go to App Settings'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('cog', 'mdi'),
        route: ['/apps', 'installed'],
        primary: true,
      }],
    },

    [AlertClassName.CatalogNotHealthy]: {
      category: SmartAlertCategory.Applications,
      relatedMenuPath: ['apps', 'available'],
      contextualHelp: T('The application catalog is not healthy, so app listings and updates may be out of date.'),
      actions: [
        {
          label: T('Browse Applications'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('apps', 'material'),
          route: ['/apps', 'available'],
          primary: true,
        },
      ],
    },

    [AlertClassName.CatalogSyncFailed]: {
      category: SmartAlertCategory.Applications,
      relatedMenuPath: ['apps', 'available'],
      contextualHelp: T('TrueNAS could not sync the application catalog. Check outbound network access and DNS.'),
      actions: [
        {
          label: T('Browse Applications'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('apps', 'material'),
          route: ['/apps', 'available'],
          primary: true,
        },
      ],
    },

    // Certificates
    [AlertClassName.CertificateExpired]: {
      category: SmartAlertCategory.Security,
      relatedMenuPath: ['credentials', 'certificates'],
      groupSummary: T('{count, plural, other {# certificates have expired}}'),
      actions: [{
        label: T('Go to Certificates'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('certificate', 'mdi'),
        route: ['/credentials', 'certificates'],
        primary: true,
      }],
    },

    [AlertClassName.CertificateIsExpiring]: {
      category: SmartAlertCategory.Security,
      relatedMenuPath: ['credentials', 'certificates'],
      groupSummary: T('{count, plural, other {# certificates are expiring}}'),
      actions: [{
        label: T('Go to Certificates'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('certificate', 'mdi'),
        route: ['/credentials', 'certificates'],
        primary: true,
      }],
    },

    [AlertClassName.CertificateIsExpiringSoon]: {
      category: SmartAlertCategory.Security,
      relatedMenuPath: ['credentials', 'certificates'],
      groupSummary: T('{count, plural, other {# certificates are expiring soon}}'),
      actions: [{
        label: T('Go to Certificates'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('certificate', 'mdi'),
        route: ['/credentials', 'certificates'],
        primary: true,
      }],
    },

    [AlertClassName.CertificateParsingFailed]: {
      category: SmartAlertCategory.Security,
      relatedMenuPath: ['credentials', 'certificates'],
      groupSummary: T('{count, plural, other {# certificates could not be parsed}}'),
      actions: [{
        label: T('Go to Certificates'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('certificate', 'mdi'),
        route: ['/credentials', 'certificates'],
        primary: true,
      }],
    },

    [AlertClassName.CertificateRevoked]: {
      category: SmartAlertCategory.Security,
      relatedMenuPath: ['credentials', 'certificates'],
      groupSummary: T('{count, plural, other {# certificates have been revoked}}'),
      actions: [{
        label: T('Go to Certificates'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('certificate', 'mdi'),
        route: ['/credentials', 'certificates'],
        primary: true,
      }],
    },

    [AlertClassName.WebUiCertificateSetupFailed]: {
      category: SmartAlertCategory.System,
      relatedMenuPath: ['system', 'general'],
      actions: [{
        label: T('Go to GUI Settings'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('desktop-classic', 'mdi'),
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
        icon: tnIconMarker('desktop-classic', 'mdi'),
        route: ['/system', 'general'],
        fragment: 'gui-settings',
        primary: true,
      }],
    },

    // Directory Services
    [AlertClassName.ActiveDirectoryDomainBind]: {
      category: SmartAlertCategory.Services,
      relatedMenuPath: ['credentials', 'directory-services'],
      documentationUrl: 'https://www.truenas.com/docs/scale/credentials/directoryservices/configadscale/',
      actions: [{
        label: T('Go To Directory Services'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('sitemap', 'mdi'),
        route: ['/credentials', 'directory-services'],
        primary: true,
      }],
    },

    [AlertClassName.ActiveDirectoryDomainHealth]: {
      category: SmartAlertCategory.Services,
      relatedMenuPath: ['credentials', 'directory-services'],
      documentationUrl: 'https://www.truenas.com/docs/scale/credentials/directoryservices/configadscale/',
      actions: [{
        label: T('Go To Directory Services'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('sitemap', 'mdi'),
        route: ['/credentials', 'directory-services'],
        primary: true,
      }],
    },

    [AlertClassName.LdapBind]: {
      category: SmartAlertCategory.Services,
      relatedMenuPath: ['credentials', 'directory-services'],
      documentationUrl: 'https://www.truenas.com/docs/scale/credentials/directoryservices/configldapscale/',
      actions: [{
        label: T('Go To Directory Services'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('sitemap', 'mdi'),
        route: ['/credentials', 'directory-services'],
        primary: true,
      }],
    },

    [AlertClassName.DirectoryServiceBind]: {
      category: SmartAlertCategory.Services,
      relatedMenuPath: ['credentials', 'directory-services'],
      contextualHelp: T('The bind to the directory service is not healthy. Check the service account credentials and that the domain controllers are reachable.'),
      actions: [
        {
          label: T('Go To Directory Services'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('account-group', 'mdi'),
          route: ['/credentials', 'directory-services'],
          primary: true,
        },
      ],
    },

    [AlertClassName.DirectoryServiceDnsUpdate]: {
      category: SmartAlertCategory.Services,
      relatedMenuPath: ['credentials', 'directory-services'],
      contextualHelp: T('TrueNAS could not update its DNS records in the directory domain, so clients may fail to resolve this server by name.'),
      actions: [
        {
          label: T('Go To Directory Services'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('account-group', 'mdi'),
          route: ['/credentials', 'directory-services'],
          primary: true,
        },
      ],
    },

    // Network
    [AlertClassName.NoCriticalFailoverInterfaceFound]: {
      category: SmartAlertCategory.Network,
      relatedMenuPath: ['system', 'network'],
      actions: [{
        label: T('Go to Network Interfaces'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('lan', 'mdi'),
        route: ['/system', 'network'],
        primary: true,
      }],
    },

    [AlertClassName.NetworkCardsMismatchOnActiveNode]: {
      category: SmartAlertCategory.Network,
      relatedMenuPath: ['system', 'network'],
      actions: [{
        label: T('Go to Network Interfaces'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('lan', 'mdi'),
        route: ['/system', 'network'],
        primary: true,
      }],
    },

    [AlertClassName.NetworkCardsMismatchOnStandbyNode]: {
      category: SmartAlertCategory.Network,
      relatedMenuPath: ['system', 'network'],
      actions: [{
        label: T('Go to Network Interfaces'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('lan', 'mdi'),
        route: ['/system', 'network'],
        primary: true,
      }],
    },

    [AlertClassName.BondMissingPorts]: {
      category: SmartAlertCategory.Network,
      relatedMenuPath: ['system', 'network'],
      groupSummary: T('{count, plural, other {# bond interfaces are missing ports}}'),
      actions: [{
        label: T('Go to Network Interfaces'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('lan', 'mdi'),
        route: ['/system', 'network'],
        primary: true,
      }],
    },

    [AlertClassName.BondInactivePorts]: {
      category: SmartAlertCategory.Network,
      relatedMenuPath: ['system', 'network'],
      groupSummary: T('{count, plural, other {# bond interfaces have inactive ports}}'),
      actions: [{
        label: T('Go to Network Interfaces'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('lan', 'mdi'),
        route: ['/system', 'network'],
        primary: true,
      }],
    },

    [AlertClassName.BondNoActivePorts]: {
      category: SmartAlertCategory.Network,
      relatedMenuPath: ['system', 'network'],
      groupSummary: T('{count, plural, other {# bond interfaces have no active ports}}'),
      actions: [{
        label: T('Go to Network Interfaces'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('lan', 'mdi'),
        route: ['/system', 'network'],
        primary: true,
      }],
    },

    // Failover
    [AlertClassName.FailoverSyncFailed]: {
      category: SmartAlertCategory.System,
      relatedMenuPath: ['system', 'advanced'],
      actions: [{
        label: T('Go to Failover Settings'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('sync', 'mdi'),
        route: ['/system', 'advanced'],
        fragment: 'failover-card',
        primary: true,
      }],
    },

    [AlertClassName.FailoverKeysSyncFailed]: {
      category: SmartAlertCategory.System,
      relatedMenuPath: ['system', 'advanced'],
      actions: [{
        label: T('Go to Failover Settings'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('sync', 'mdi'),
        route: ['/system', 'advanced'],
        fragment: 'failover-card',
        primary: true,
      }],
    },

    [AlertClassName.FailoverFailed]: {
      category: SmartAlertCategory.System,
      relatedMenuPath: ['system', 'advanced'],
      contextualHelp: T('A failover attempt did not complete. The pair may be left without a healthy active controller until this is resolved.'),
      actions: [
        {
          label: T('Go to Failover Settings'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('sync', 'mdi'),
          route: ['/system', 'advanced'],
          primary: true,
        },
        {
          label: T('Contact Support'),
          type: SmartAlertActionType.ExternalLink,
          icon: tnIconMarker('help-circle', 'mdi'),
          externalUrl: 'https://support.ixsystems.com',
        },
      ],
    },

    [AlertClassName.FailoverStatusCheckFailed]: {
      category: SmartAlertCategory.System,
      relatedMenuPath: ['system', 'advanced'],
      contextualHelp: T('TrueNAS could not determine the failover state of the other controller. Check the heartbeat connection between the controllers.'),
      actions: [
        {
          label: T('Go to Failover Settings'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('sync', 'mdi'),
          route: ['/system', 'advanced'],
          primary: true,
        },
      ],
    },

    [AlertClassName.FailoverRemoteSystemInaccessible]: {
      category: SmartAlertCategory.System,
      relatedMenuPath: ['system', 'advanced'],
      contextualHelp: T('The other controller cannot be reached. Failover is not available while it stays inaccessible.'),
      actions: [
        {
          label: T('Go to Failover Settings'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('sync', 'mdi'),
          route: ['/system', 'advanced'],
          primary: true,
        },
        {
          label: T('Contact Support'),
          type: SmartAlertActionType.ExternalLink,
          icon: tnIconMarker('help-circle', 'mdi'),
          externalUrl: 'https://support.ixsystems.com',
        },
      ],
    },

    [AlertClassName.FailoverReboot]: {
      category: SmartAlertCategory.System,
      relatedMenuPath: ['system', 'advanced'],
      contextualHelp: T('A failover event rebooted this controller. Review the failover configuration if this was not expected.'),
      actions: [
        {
          label: T('Go to Failover Settings'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('sync', 'mdi'),
          route: ['/system', 'advanced'],
          primary: true,
        },
      ],
    },

    [AlertClassName.FencedReboot]: {
      category: SmartAlertCategory.System,
      relatedMenuPath: ['system', 'advanced'],
      contextualHelp: T('Fenced rebooted this controller to protect the pool from being imported on both controllers at once.'),
      actions: [
        {
          label: T('Go to Failover Settings'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('sync', 'mdi'),
          route: ['/system', 'advanced'],
          primary: true,
        },
      ],
    },

    [AlertClassName.FailoverInterfaceNotFound]: {
      category: SmartAlertCategory.Network,
      relatedMenuPath: ['system', 'network'],
      contextualHelp: T('The internal failover interface is missing. The controllers cannot exchange heartbeats without it.'),
      actions: [
        {
          label: T('Go to Network Interfaces'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('network', 'mdi'),
          route: ['/system', 'network'],
          primary: true,
        },
      ],
    },

    [AlertClassName.VrrpStatesDoNotAgree]: {
      category: SmartAlertCategory.Network,
      relatedMenuPath: ['system', 'network'],
      contextualHelp: T('The controllers disagree about which one holds the VRRP master role. Check the network path between them.'),
      actions: [
        {
          label: T('Go to Network Interfaces'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('network', 'mdi'),
          route: ['/system', 'network'],
          primary: true,
        },
      ],
    },

    [AlertClassName.FailoverKmipKeysSyncFailed]: {
      category: SmartAlertCategory.Security,
      relatedMenuPath: ['credentials', 'kmip'],
      contextualHelp: T('KMIP keys could not be synced to the other controller, so it may not be able to unlock encrypted data after a failover.'),
      actions: [
        {
          label: T('Go to KMIP'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('key-variant', 'mdi'),
          route: ['/credentials', 'kmip'],
          primary: true,
        },
      ],
    },

    [AlertClassName.TrueNasVersionsMismatch]: {
      category: SmartAlertCategory.System,
      relatedMenuPath: ['system', 'update'],
      contextualHelp: T('The controllers are running different TrueNAS versions. Failover is not supported until both run the same version.'),
      actions: [
        {
          label: T('View Updates'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('update', 'mdi'),
          route: ['/system', 'update'],
          primary: true,
        },
      ],
    },

    [AlertClassName.DisksAreNotPresentOnActiveNode]: {
      category: SmartAlertCategory.System,
      relatedMenuPath: ['storage', 'disks'],
      contextualHelp: T('Disks visible to the standby controller are missing on the active controller. Check cabling and expansion shelf connections.'),
      actions: [
        {
          label: T('Go to Disks'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('harddisk', 'mdi'),
          route: ['/storage', 'disks'],
          primary: true,
        },
      ],
    },

    [AlertClassName.DisksAreNotPresentOnStandbyNode]: {
      category: SmartAlertCategory.System,
      relatedMenuPath: ['storage', 'disks'],
      contextualHelp: T('Disks visible to the active controller are missing on the standby controller, which would prevent it from importing the pool after a failover.'),
      actions: [
        {
          label: T('Go to Disks'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('harddisk', 'mdi'),
          route: ['/storage', 'disks'],
          primary: true,
        },
      ],
    },

    // JBOF
    [AlertClassName.JbofRedfishComm]: {
      category: SmartAlertCategory.Hardware,
      relatedMenuPath: ['system', 'viewenclosure', 'jbof'],
      actions: [{
        label: T('Go to JBOF'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('expansion-card', 'mdi'),
        route: ['/system', 'viewenclosure', 'jbof'],
        primary: true,
      }],
    },

    [AlertClassName.JbofElementCritical]: {
      category: SmartAlertCategory.Hardware,
      relatedMenuPath: ['system', 'viewenclosure', 'jbof'],
      actions: [{
        label: T('Go to JBOF'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('expansion-card', 'mdi'),
        route: ['/system', 'viewenclosure', 'jbof'],
        primary: true,
      }],
    },

    [AlertClassName.JbofElementWarning]: {
      category: SmartAlertCategory.Hardware,
      relatedMenuPath: ['system', 'viewenclosure', 'jbof'],
      actions: [{
        label: T('Go to JBOF'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('expansion-card', 'mdi'),
        route: ['/system', 'viewenclosure', 'jbof'],
        primary: true,
      }],
    },

    [AlertClassName.JbofTearDownFailure]: {
      category: SmartAlertCategory.Hardware,
      relatedMenuPath: ['system', 'viewenclosure', 'jbof'],
      actions: [{
        label: T('Go to JBOF'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('expansion-card', 'mdi'),
        route: ['/system', 'viewenclosure', 'jbof'],
        primary: true,
      }],
    },

    [AlertClassName.JbofInvalidData]: {
      category: SmartAlertCategory.Hardware,
      relatedMenuPath: ['system', 'viewenclosure', 'jbof'],
      actions: [{
        label: T('Go to JBOF'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('expansion-card', 'mdi'),
        route: ['/system', 'viewenclosure', 'jbof'],
        primary: true,
      }],
    },

    // Disks & SMART
    [AlertClassName.Smart]: {
      category: SmartAlertCategory.Hardware,
      relatedMenuPath: ['storage', 'disks'],
      groupSummary: T('{count, plural, other {SMART reported problems on # disks}}'),
      documentationUrl: 'https://www.truenas.com/docs/scale/storage/disks/',
      actions: [{
        label: T('Go to Disks'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('harddisk', 'mdi'),
        route: ['/storage', 'disks'],
        primary: true,
      }],
    },

    // The single SMART alert class was split into per-condition classes. Each one names a
    // disk, so they all lead to the disk list.
    [AlertClassName.SmartUncorrectedErrors]: {
      category: SmartAlertCategory.Hardware,
      relatedMenuPath: ['storage', 'disks'],
      contextualHelp: T('The disk reported errors it could not correct on its own. Check the disk in the list below and plan a replacement if the count keeps climbing.'),
      documentationUrl: 'https://www.truenas.com/docs/scale/storage/disks/',
      actions: [{
        label: T('Go to Disks'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('harddisk', 'mdi'),
        route: ['/storage', 'disks'],
        primary: true,
      }],
    },

    [AlertClassName.SmartFailedSelfTest]: {
      category: SmartAlertCategory.Hardware,
      relatedMenuPath: ['storage', 'disks'],
      contextualHelp: T('The disk failed its SMART self-test. Review the disk and replace it before it fails outright.'),
      documentationUrl: 'https://www.truenas.com/docs/scale/storage/disks/',
      actions: [{
        label: T('Go to Disks'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('harddisk', 'mdi'),
        route: ['/storage', 'disks'],
        primary: true,
      }],
    },

    [AlertClassName.SmartSpareBlockCount]: {
      category: SmartAlertCategory.Hardware,
      relatedMenuPath: ['storage', 'disks'],
      contextualHelp: T('The disk has almost exhausted the spare blocks it uses to retire failing sectors. Replace it.'),
      documentationUrl: 'https://www.truenas.com/docs/scale/storage/disks/',
      actions: [{
        label: T('Go to Disks'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('harddisk', 'mdi'),
        route: ['/storage', 'disks'],
        primary: true,
      }],
    },

    [AlertClassName.SmartEraseCycleCount]: {
      category: SmartAlertCategory.Hardware,
      relatedMenuPath: ['storage', 'disks'],
      contextualHelp: T('The SSD is approaching the end of its rated write endurance. Plan a replacement.'),
      documentationUrl: 'https://www.truenas.com/docs/scale/storage/disks/',
      actions: [{
        label: T('Go to Disks'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('harddisk', 'mdi'),
        route: ['/storage', 'disks'],
        primary: true,
      }],
    },

    [AlertClassName.DiskTemperatureTooHot]: {
      category: SmartAlertCategory.Hardware,
      relatedMenuPath: ['storage', 'disks'],
      contextualHelp: T('The disk is running above its rated temperature. Check chassis airflow and fan operation.'),
      documentationUrl: 'https://www.truenas.com/docs/scale/storage/disks/',
      actions: [{
        label: T('Go to Disks'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('harddisk', 'mdi'),
        route: ['/storage', 'disks'],
        primary: true,
      }],
    },

    [AlertClassName.DifFormatted]: {
      category: SmartAlertCategory.Hardware,
      relatedMenuPath: ['storage', 'disks'],
      contextualHelp: T('The disk is formatted with the Data Integrity Feature (DIF) and cannot be used by ZFS. Reformat it without DIF before adding it to a pool.'),
      documentationUrl: 'https://www.truenas.com/docs/scale/storage/disks/',
      actions: [{
        label: T('Go to Disks'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('harddisk', 'mdi'),
        route: ['/storage', 'disks'],
        primary: true,
      }],
    },

    [AlertClassName.UsbStorage]: {
      category: SmartAlertCategory.Hardware,
      relatedMenuPath: ['storage', 'disks'],
      contextualHelp: T('A USB storage device was connected. USB devices are not supported for pool data and can drop off the bus without warning.'),
      documentationUrl: 'https://www.truenas.com/docs/scale/storage/disks/',
      actions: [{
        label: T('Go to Disks'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('harddisk', 'mdi'),
        route: ['/storage', 'disks'],
        primary: true,
      }],
    },

    [AlertClassName.Smartd]: {
      category: SmartAlertCategory.Services,
      relatedMenuPath: ['system', 'services'],
      actions: [{
        label: T('Go to Services'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('cog', 'mdi'),
        route: ['/system', 'services'],
        primary: true,
      }],
    },

    // Enclosure, sensors and chassis hardware
    [AlertClassName.EnclosureUnhealthy]: {
      category: SmartAlertCategory.Hardware,
      relatedMenuPath: ['system', 'viewenclosure'],
      contextualHelp: T('An enclosure element is reporting a fault. Open the enclosure view to find the failed element.'),
      actions: [
        {
          label: T('View Enclosure'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('server', 'mdi'),
          route: ['/system', 'viewenclosure'],
          primary: true,
        },
      ],
    },

    [AlertClassName.EnclosureHealthy]: {
      category: SmartAlertCategory.Hardware,
      relatedMenuPath: ['system', 'viewenclosure'],
      contextualHelp: T('The enclosure recovered and all of its elements are reporting healthy again.'),
      actions: [
        {
          label: T('View Enclosure'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('server', 'mdi'),
          route: ['/system', 'viewenclosure'],
          primary: true,
        },
      ],
    },

    [AlertClassName.PowerSupply]: {
      category: SmartAlertCategory.Hardware,
      relatedMenuPath: ['system', 'viewenclosure'],
      contextualHelp: T('A power supply is not delivering power. Check that it is seated and that its power cord is connected.'),
      actions: [
        {
          label: T('View Enclosure'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('server', 'mdi'),
          route: ['/system', 'viewenclosure'],
          primary: true,
        },
        {
          label: T('Contact Support'),
          type: SmartAlertActionType.ExternalLink,
          icon: tnIconMarker('help-circle', 'mdi'),
          externalUrl: 'https://support.ixsystems.com',
        },
      ],
    },

    [AlertClassName.Sensor]: {
      category: SmartAlertCategory.Hardware,
      relatedMenuPath: ['system', 'viewenclosure'],
      contextualHelp: T('A chassis sensor is reading outside its working range. Check fans, airflow and ambient temperature.'),
      actions: [
        {
          label: T('View Enclosure'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('server', 'mdi'),
          route: ['/system', 'viewenclosure'],
          primary: true,
        },
      ],
    },

    // NVDIMM alerts previously relied on a regex fallback in patternCategories.
    // They are mapped explicitly here so the routing no longer depends on the alert wording.
    [AlertClassName.Nvdimm]: {
      category: SmartAlertCategory.Hardware,
      relatedMenuPath: ['system', 'viewenclosure'],
      contextualHelp: T('An NVDIMM is reporting a fault. NVDIMM failures put write-cached data at risk, so raise a support case.'),
      actions: [
        {
          label: T('View Enclosure'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('server', 'mdi'),
          route: ['/system', 'viewenclosure'],
          primary: true,
        },
        {
          label: T('Contact Support'),
          type: SmartAlertActionType.ExternalLink,
          icon: tnIconMarker('help-circle', 'mdi'),
          externalUrl: 'https://support.ixsystems.com',
        },
      ],
    },

    [AlertClassName.NvdimmEsLifetimeCritical]: {
      category: SmartAlertCategory.Hardware,
      relatedMenuPath: ['system', 'viewenclosure'],
      contextualHelp: T('The NVDIMM energy source is nearly exhausted and may no longer be able to flush cached writes on power loss. Replace it.'),
      actions: [
        {
          label: T('View Enclosure'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('server', 'mdi'),
          route: ['/system', 'viewenclosure'],
          primary: true,
        },
        {
          label: T('Contact Support'),
          type: SmartAlertActionType.ExternalLink,
          icon: tnIconMarker('help-circle', 'mdi'),
          externalUrl: 'https://support.ixsystems.com',
        },
      ],
    },

    [AlertClassName.NvdimmEsLifetimeWarning]: {
      category: SmartAlertCategory.Hardware,
      relatedMenuPath: ['system', 'viewenclosure'],
      contextualHelp: T('The NVDIMM energy source is wearing out. Plan its replacement.'),
      actions: [
        {
          label: T('View Enclosure'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('server', 'mdi'),
          route: ['/system', 'viewenclosure'],
          primary: true,
        },
        {
          label: T('Contact Support'),
          type: SmartAlertActionType.ExternalLink,
          icon: tnIconMarker('help-circle', 'mdi'),
          externalUrl: 'https://support.ixsystems.com',
        },
      ],
    },

    [AlertClassName.NvdimmMemoryModLifetimeCritical]: {
      category: SmartAlertCategory.Hardware,
      relatedMenuPath: ['system', 'viewenclosure'],
      contextualHelp: T('The NVDIMM memory module is nearly at the end of its rated life. Replace it.'),
      actions: [
        {
          label: T('View Enclosure'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('server', 'mdi'),
          route: ['/system', 'viewenclosure'],
          primary: true,
        },
        {
          label: T('Contact Support'),
          type: SmartAlertActionType.ExternalLink,
          icon: tnIconMarker('help-circle', 'mdi'),
          externalUrl: 'https://support.ixsystems.com',
        },
      ],
    },

    [AlertClassName.NvdimmMemoryModLifetimeWarning]: {
      category: SmartAlertCategory.Hardware,
      relatedMenuPath: ['system', 'viewenclosure'],
      contextualHelp: T('The NVDIMM memory module is wearing out. Plan its replacement.'),
      actions: [
        {
          label: T('View Enclosure'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('server', 'mdi'),
          route: ['/system', 'viewenclosure'],
          primary: true,
        },
        {
          label: T('Contact Support'),
          type: SmartAlertActionType.ExternalLink,
          icon: tnIconMarker('help-circle', 'mdi'),
          externalUrl: 'https://support.ixsystems.com',
        },
      ],
    },

    [AlertClassName.NvdimmInvalidFirmwareVersion]: {
      category: SmartAlertCategory.Hardware,
      relatedMenuPath: ['system', 'viewenclosure'],
      contextualHelp: T('The NVDIMM is running a firmware version that is not supported by this release. Contact support for a firmware update.'),
      actions: [
        {
          label: T('View Enclosure'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('server', 'mdi'),
          route: ['/system', 'viewenclosure'],
          primary: true,
        },
        {
          label: T('Contact Support'),
          type: SmartAlertActionType.ExternalLink,
          icon: tnIconMarker('help-circle', 'mdi'),
          externalUrl: 'https://support.ixsystems.com',
        },
      ],
    },

    [AlertClassName.NvdimmRecommendedFirmwareVersion]: {
      category: SmartAlertCategory.Hardware,
      relatedMenuPath: ['system', 'viewenclosure'],
      contextualHelp: T('A newer NVDIMM firmware version is recommended for this release.'),
      actions: [
        {
          label: T('View Enclosure'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('server', 'mdi'),
          route: ['/system', 'viewenclosure'],
          primary: true,
        },
        {
          label: T('Contact Support'),
          type: SmartAlertActionType.ExternalLink,
          icon: tnIconMarker('help-circle', 'mdi'),
          externalUrl: 'https://support.ixsystems.com',
        },
      ],
    },

    // Boot media wear. SATA DOMs are the boot devices on this hardware.
    [AlertClassName.SataDomWearCritical]: {
      category: SmartAlertCategory.Hardware,
      relatedMenuPath: ['system', 'boot'],
      contextualHelp: T('The boot SATA DOM has nearly exhausted its write endurance. Replace it before it fails.'),
      documentationUrl: 'https://www.truenas.com/docs/scale/systemsettings/boot/managebootenviron/',
      actions: [{
        label: T('Manage Boot Environments'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('layers', 'mdi'),
        route: bootListElements.anchorRouterLink,
        primary: true,
      }],
    },

    [AlertClassName.SataDomWearWarning]: {
      category: SmartAlertCategory.Hardware,
      relatedMenuPath: ['system', 'boot'],
      contextualHelp: T('The boot SATA DOM is wearing out. Plan its replacement.'),
      documentationUrl: 'https://www.truenas.com/docs/scale/systemsettings/boot/managebootenviron/',
      actions: [{
        label: T('Manage Boot Environments'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('layers', 'mdi'),
        route: bootListElements.anchorRouterLink,
        primary: true,
      }],
    },

    // These conditions need physical attention and have no page to send the user to, so they
    // are categorized and given a support link but deliberately badge no menu.
    // NOTE: IPMISEL currently falls through to the /ipmi/ pattern rule and badges Network,
    // which is wrong — webui has had no IPMI page since the Network rework.
    [AlertClassName.IpmiSel]: {
      category: SmartAlertCategory.Hardware,
      contextualHelp: T('The IPMI system event log recorded a hardware event. Review the event log from the BMC web interface.'),
      actions: [
        {
          label: T('Contact Support'),
          type: SmartAlertActionType.ExternalLink,
          icon: tnIconMarker('help-circle', 'mdi'),
          externalUrl: 'https://support.ixsystems.com',
          primary: true,
        },
      ],
    },

    [AlertClassName.IpmiSelSpaceLeft]: {
      category: SmartAlertCategory.Hardware,
      contextualHelp: T('The IPMI system event log is nearly full and will stop recording new events. Clear it from the BMC web interface.'),
      actions: [
        {
          label: T('Contact Support'),
          type: SmartAlertActionType.ExternalLink,
          icon: tnIconMarker('help-circle', 'mdi'),
          externalUrl: 'https://support.ixsystems.com',
          primary: true,
        },
      ],
    },

    [AlertClassName.MemoryErrors]: {
      category: SmartAlertCategory.Hardware,
      contextualHelp: T('The system reported memory errors it could not correct. Faulty memory can corrupt data — raise a support case.'),
      actions: [
        {
          label: T('Contact Support'),
          type: SmartAlertActionType.ExternalLink,
          icon: tnIconMarker('help-circle', 'mdi'),
          externalUrl: 'https://support.ixsystems.com',
          primary: true,
        },
      ],
    },

    [AlertClassName.MemorySizeMismatch]: {
      category: SmartAlertCategory.Hardware,
      contextualHelp: T('The controllers of this HA pair report different amounts of memory. They should be configured identically.'),
      actions: [
        {
          label: T('Contact Support'),
          type: SmartAlertActionType.ExternalLink,
          icon: tnIconMarker('help-circle', 'mdi'),
          externalUrl: 'https://support.ixsystems.com',
          primary: true,
        },
      ],
    },

    [AlertClassName.OldBiosVersion]: {
      category: SmartAlertCategory.Hardware,
      contextualHelp: T('The system is running an outdated BIOS. Contact support for the recommended version and the update procedure.'),
      actions: [
        {
          label: T('Contact Support'),
          type: SmartAlertActionType.ExternalLink,
          icon: tnIconMarker('help-circle', 'mdi'),
          externalUrl: 'https://support.ixsystems.com',
          primary: true,
        },
      ],
    },

    // KMIP
    [AlertClassName.KmipConnectionFailed]: {
      category: SmartAlertCategory.Security,
      relatedMenuPath: ['credentials', 'kmip'],
      documentationUrl: 'https://www.truenas.com/docs/scale/credentials/configuringkmipscale/',
      actions: [{
        label: T('Go to KMIP'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('key-variant', 'mdi'),
        route: ['/credentials', 'kmip'],
        primary: true,
      }],
    },

    [AlertClassName.KmipSedGlobalPasswordSyncFailure]: {
      category: SmartAlertCategory.Security,
      relatedMenuPath: ['credentials', 'kmip'],
      documentationUrl: 'https://www.truenas.com/docs/scale/credentials/configuringkmipscale/',
      actions: [{
        label: T('Go to KMIP'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('key-variant', 'mdi'),
        route: ['/credentials', 'kmip'],
        primary: true,
      }],
    },

    [AlertClassName.KmipSedDisksSyncFailure]: {
      category: SmartAlertCategory.Security,
      relatedMenuPath: ['credentials', 'kmip'],
      documentationUrl: 'https://www.truenas.com/docs/scale/credentials/configuringkmipscale/',
      actions: [{
        label: T('Go to KMIP'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('key-variant', 'mdi'),
        route: ['/credentials', 'kmip'],
        primary: true,
      }],
    },

    [AlertClassName.KmipZfsDatasetsSyncFailure]: {
      category: SmartAlertCategory.Security,
      relatedMenuPath: ['credentials', 'kmip'],
      documentationUrl: 'https://www.truenas.com/docs/scale/credentials/configuringkmipscale/',
      actions: [{
        label: T('Go to KMIP'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('key-variant', 'mdi'),
        route: ['/credentials', 'kmip'],
        primary: true,
      }],
    },

    // NFS
    [AlertClassName.NfsBindAddress]: {
      category: SmartAlertCategory.Services,
      relatedMenuPath: ['system', 'services'],
      documentationUrl: 'https://www.truenas.com/docs/scale/systemsettings/services/nfsservicescale/',
      actions: [{
        label: T('Go to NFS Service'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('folder-network', 'mdi'),
        route: ['/system', 'services'],
        fragment: 'nfs',
        primary: true,
      }],
    },

    [AlertClassName.NfsHostListExcessive]: {
      category: SmartAlertCategory.Services,
      relatedMenuPath: ['sharing', 'nfs'],
      contextualHelp: T('An NFS share lists so many hosts that the export cannot be written. Use networks instead of individual hosts to shorten the list.'),
      actions: [
        {
          label: T('Go to NFS Shares'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('folder-network', 'mdi'),
          route: ['/sharing', 'nfs'],
          primary: true,
        },
      ],
    },

    [AlertClassName.NfsNetworkListExcessive]: {
      category: SmartAlertCategory.Services,
      relatedMenuPath: ['sharing', 'nfs'],
      contextualHelp: T('An NFS share lists so many networks that the export cannot be written. Consolidate the list into wider subnets.'),
      actions: [
        {
          label: T('Go to NFS Shares'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('folder-network', 'mdi'),
          route: ['/sharing', 'nfs'],
          primary: true,
        },
      ],
    },

    [AlertClassName.NfsBlockedByExportsDir]: {
      category: SmartAlertCategory.Services,
      relatedMenuPath: ['sharing', 'nfs'],
      contextualHelp: T('Entries in /etc/exports.d are blocking the NFS server from starting. Remove them so TrueNAS can manage the exports.'),
      actions: [
        {
          label: T('Go to NFS Shares'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('folder-network', 'mdi'),
          route: ['/sharing', 'nfs'],
          primary: true,
        },
      ],
    },

    [AlertClassName.NfsExportMappingInvalidNames]: {
      category: SmartAlertCategory.Services,
      relatedMenuPath: ['sharing', 'nfs'],
      contextualHelp: T('An NFS export was skipped because its user or group mapping refers to a name that does not resolve.'),
      actions: [
        {
          label: T('Go to NFS Shares'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('folder-network', 'mdi'),
          route: ['/sharing', 'nfs'],
          primary: true,
        },
      ],
    },

    [AlertClassName.NfsHostnameLookupFail]: {
      category: SmartAlertCategory.Services,
      relatedMenuPath: ['sharing', 'nfs'],
      contextualHelp: T('Some NFS shares reference hostnames that could not be resolved, so those clients will be denied access.'),
      actions: [
        {
          label: T('Go to NFS Shares'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('folder-network', 'mdi'),
          route: ['/sharing', 'nfs'],
          primary: true,
        },
      ],
    },

    // SMB
    [AlertClassName.SmbPath]: {
      category: SmartAlertCategory.Services,
      relatedMenuPath: ['sharing', 'smb'],
      groupSummary: T('{count, plural, other {# SMB shares have a path problem}}'),
      documentationUrl: 'https://www.truenas.com/docs/scale/shares/smb/managesmbshares/',
      actions: [{
        label: T('Go to SMB shares'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('folder-network', 'mdi'),
        route: ['/sharing', 'smb'],
        primary: true,
      }],
    },

    [AlertClassName.SmbLegacyProtocol]: {
      category: SmartAlertCategory.Services,
      relatedMenuPath: ['sharing', 'smb'],
      documentationUrl: 'https://www.truenas.com/docs/scale/systemsettings/services/smbservicescale/',
      actions: [{
        label: T('Go to SMB sessions'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('folder-network', 'mdi'),
        route: ['/sharing', 'smb', 'status', 'sessions'],
        primary: true,
      }],
    },

    [AlertClassName.SmbAuditShareDisabled]: {
      category: SmartAlertCategory.Services,
      relatedMenuPath: ['sharing', 'smb'],
      contextualHelp: T('SMB auditing is disabled on a share because its watch or ignore list refers to groups that no longer exist.'),
      actions: [
        {
          label: T('Go to SMB shares'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('folder-network', 'mdi'),
          route: ['/sharing', 'smb'],
          primary: true,
        },
      ],
    },

    [AlertClassName.SmbUserMissingHash]: {
      category: SmartAlertCategory.Services,
      relatedMenuPath: ['credentials', 'users'],
      contextualHelp: T('An SMB user has no stored password hash and cannot authenticate. Reset the password to generate one.'),
      actions: [
        {
          label: T('Manage Users'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('account-multiple', 'mdi'),
          route: ['/credentials', 'users'],
          primary: true,
        },
      ],
    },

    [AlertClassName.SmbVeeamFastClone]: {
      category: SmartAlertCategory.Services,
      relatedMenuPath: ['sharing', 'smb'],
      contextualHelp: T('A share used for Veeam Fast Clone has a record size that prevents block cloning. Set the dataset record size to 512K or larger.'),
      actions: [
        {
          label: T('Go to SMB shares'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('folder-network', 'mdi'),
          route: ['/sharing', 'smb'],
          primary: true,
        },
      ],
    },

    [AlertClassName.Ntlmv1Authentication]: {
      category: SmartAlertCategory.Security,
      relatedMenuPath: ['sharing', 'smb'],
      contextualHelp: T('A client authenticated with NTLMv1, which is obsolete and easily broken. Find the client in the session list and reconfigure it.'),
      actions: [
        {
          label: T('Go to SMB sessions'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('folder-network', 'mdi'),
          route: ['/sharing', 'smb', 'status', 'sessions'],
          primary: true,
        },
      ],
    },

    // iSCSI and Fibre Channel
    [AlertClassName.IscsiAuthSecretInvalidChar]: {
      category: SmartAlertCategory.Services,
      relatedMenuPath: ['sharing', 'iscsi'],
      contextualHelp: T('An iSCSI authorized access secret contains a character that initiators cannot send. Re-enter the secret using printable ASCII only.'),
      actions: [
        {
          label: T('Go to Authorized Access'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('shield-check', 'mdi'),
          route: ['/sharing', 'iscsi', 'authorized-access'],
          primary: true,
        },
      ],
    },

    [AlertClassName.IscsiAuthSecretWhitespace]: {
      category: SmartAlertCategory.Services,
      relatedMenuPath: ['sharing', 'iscsi'],
      contextualHelp: T('An iSCSI authorized access secret has leading or trailing whitespace, which initiators will not reproduce. Re-enter it.'),
      actions: [
        {
          label: T('Go to Authorized Access'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('shield-check', 'mdi'),
          route: ['/sharing', 'iscsi', 'authorized-access'],
          primary: true,
        },
      ],
    },

    [AlertClassName.IscsiDiscoveryAuthMixed]: {
      category: SmartAlertCategory.Services,
      relatedMenuPath: ['sharing', 'iscsi'],
      contextualHelp: T('Portals disagree about discovery authentication. Discovery auth is global, so the strictest setting is applied to every portal.'),
      actions: [
        {
          label: T('Go to Authorized Access'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('shield-check', 'mdi'),
          route: ['/sharing', 'iscsi', 'authorized-access'],
          primary: true,
        },
      ],
    },

    [AlertClassName.IscsiDiscoveryAuthMultipleChap]: {
      category: SmartAlertCategory.Services,
      relatedMenuPath: ['sharing', 'iscsi'],
      contextualHelp: T('Several CHAP entries are configured for discovery authentication. They have been merged, which may not be what you intended.'),
      actions: [
        {
          label: T('Go to Authorized Access'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('shield-check', 'mdi'),
          route: ['/sharing', 'iscsi', 'authorized-access'],
          primary: true,
        },
      ],
    },

    [AlertClassName.IscsiDiscoveryAuthMultipleMutualChap]: {
      category: SmartAlertCategory.Services,
      relatedMenuPath: ['sharing', 'iscsi'],
      contextualHelp: T('Several mutual CHAP entries are configured for discovery authentication. Only one can apply, so the others are ignored.'),
      actions: [
        {
          label: T('Go to Authorized Access'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('shield-check', 'mdi'),
          route: ['/sharing', 'iscsi', 'authorized-access'],
          primary: true,
        },
      ],
    },

    [AlertClassName.IscsiPortalIp]: {
      category: SmartAlertCategory.Services,
      relatedMenuPath: ['sharing', 'iscsi'],
      contextualHelp: T('An iSCSI portal is bound to an IP address that no longer exists on this system, so the portal will not listen.'),
      actions: [
        {
          label: T('Go to Portals'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('network', 'mdi'),
          route: ['/sharing', 'iscsi', 'portals'],
          primary: true,
        },
      ],
    },

    [AlertClassName.FcHardwareAdded]: {
      category: SmartAlertCategory.Services,
      relatedMenuPath: ['sharing', 'iscsi'],
      contextualHelp: T('New Fibre Channel HBAs were detected. Assign their ports before initiators can use them.'),
      actions: [
        {
          label: T('Go to Fibre Channel Ports'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('network', 'mdi'),
          route: ['/sharing', 'iscsi', 'fibre-channel-ports'],
          primary: true,
        },
      ],
    },

    [AlertClassName.FcHardwareReplaced]: {
      category: SmartAlertCategory.Services,
      relatedMenuPath: ['sharing', 'iscsi'],
      contextualHelp: T('A Fibre Channel HBA was replaced. Confirm that the port assignments carried over to the new hardware.'),
      actions: [
        {
          label: T('Go to Fibre Channel Ports'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('network', 'mdi'),
          route: ['/sharing', 'iscsi', 'fibre-channel-ports'],
          primary: true,
        },
      ],
    },

    [AlertClassName.DeprecatedService]: {
      category: SmartAlertCategory.Services,
      relatedMenuPath: ['system', 'services'],
      contextualHelp: T('A deprecated service is running. It will be removed in a future release, so plan a replacement.'),
      actions: [
        {
          label: T('Go to Services'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('cog', 'mdi'),
          route: ['/system', 'services'],
          primary: true,
        },
      ],
    },

    // Datasets
    [AlertClassName.ShareLocked]: {
      category: SmartAlertCategory.Storage,
      relatedMenuPath: ['datasets'],
      groupSummary: T('{count, plural, other {# shares are unavailable because their dataset is locked}}'),
      actions: [{
        label: T('Go to Datasets'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('database', 'mdi'),
        route: ['/datasets'],
        primary: true,
      }],
    },

    [AlertClassName.QuotaCritical]: {
      category: SmartAlertCategory.Storage,
      relatedMenuPath: ['datasets'],
      groupSummary: T('{count, plural, other {# datasets have exceeded their quota}}'),
      documentationUrl: 'https://www.truenas.com/docs/scale/datasets/managequotas/',
      actions: [{
        label: T('Go to Datasets'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('database', 'mdi'),
        route: ['/datasets'],
        primary: true,
      }],
    },

    [AlertClassName.QuotaWarning]: {
      category: SmartAlertCategory.Storage,
      relatedMenuPath: ['datasets'],
      groupSummary: T('{count, plural, other {# datasets are approaching their quota}}'),
      documentationUrl: 'https://www.truenas.com/docs/scale/datasets/managequotas/',
      actions: [{
        label: T('Go to Datasets'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('database', 'mdi'),
        route: ['/datasets'],
        primary: true,
      }],
    },

    [AlertClassName.EncryptedDataset]: {
      category: SmartAlertCategory.Storage,
      relatedMenuPath: ['datasets'],
      groupSummary: T('{count, plural, other {# datasets are locked}}'),
      actions: [{
        label: T('Go to Datasets'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('database', 'mdi'),
        route: ['/datasets'],
        primary: true,
      }],
    },

    TaskLocked: {
      category: SmartAlertCategory.Storage,
      relatedMenuPath: ['datasets'],
      groupSummary: T('{count, plural, other {# tasks are skipped because their dataset is locked}}'),
      actions: [{
        label: T('Go to Datasets'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('database', 'mdi'),
        route: ['/datasets'],
        primary: true,
      }],
    },

    // ZFS Tiering
    // Special allocation class (special vdev) capacity is a pool-level condition, but it is
    // resolved from Datasets by moving datasets back to the Regular tier — badge both menus.
    [AlertClassName.TierSpecialVdevCritical]: {
      category: SmartAlertCategory.Storage,
      relatedMenuPath: ['storage'],
      extraMenuPaths: [['datasets']],
      contextualHelp: T('The special allocation class of this pool is nearly full. Tier rewrites will abort and new Performance tier writes will overflow into the Regular tier. Free space by moving datasets back to the Regular tier, or expand the special vdev.'),
      actions: [{
        label: T('Go to Storage'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('dns', 'material'),
        route: ['/storage'],
        primary: true,
      }, {
        label: T('Go to Datasets'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('database', 'mdi'),
        route: ['/datasets'],
      }],
    },

    [AlertClassName.TierSpecialVdevWarning]: {
      category: SmartAlertCategory.Storage,
      relatedMenuPath: ['storage'],
      extraMenuPaths: [['datasets']],
      contextualHelp: T('The special allocation class of this pool is approaching the configured critical cap. Review the tier assignments of your datasets or expand the special vdev before tier rewrites start to fail.'),
      actions: [{
        label: T('Go to Storage'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('dns', 'material'),
        route: ['/storage'],
        primary: true,
      }, {
        label: T('Go to Datasets'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('database', 'mdi'),
        route: ['/datasets'],
      }],
    },

    [AlertClassName.TierJobError]: {
      category: SmartAlertCategory.Tasks,
      relatedMenuPath: ['datasets'],
      contextualHelp: T('A tier migration job did not finish. The dataset keeps its previous tier placement until the migration is retried.'),
      actions: [{
        label: T('Go to Datasets'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('database', 'mdi'),
        route: ['/datasets'],
        primary: true,
      }],
    },

    // Informational only, so it carries no menu path and never badges a menu.
    // (Notice-level alerts are filtered out of the badge and banner surfaces upstream.)
    [AlertClassName.TierJobComplete]: {
      category: SmartAlertCategory.Tasks,
      actions: [{
        label: T('Go to Datasets'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('database', 'mdi'),
        route: ['/datasets'],
        primary: true,
      }],
    },

    // Storage/Pools
    PoolUpgraded: {
      category: SmartAlertCategory.Storage,
      relatedMenuPath: ['storage'],
      groupSummary: T('{count, plural, other {A new ZFS version or feature flags are available for # pools}}'),
      actions: [{
        label: T('Go to Storage'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('dns', 'material'),
        route: ['/storage'],
        primary: true,
      }],
    },

    [AlertClassName.ZpoolCapacityCritical]: {
      conditions: [
        {
          // Boot pool capacity - direct to Boot Environments management
          check: (alert: Alert) => isBootPoolAlert(alert.args),
          enhancement: {
            category: SmartAlertCategory.System,
            relatedMenuPath: ['system', 'boot'],
            contextualHelp: T('Boot pool capacity is critically high. Clean up old boot environments to free up space and prevent system issues.'),
            documentationUrl: 'https://www.truenas.com/docs/scale/systemsettings/boot/managebootenviron/',
            actions: [{
              label: T('Manage Boot Environments'),
              type: SmartAlertActionType.Navigate,
              icon: tnIconMarker('layers', 'mdi'),
              route: bootListElements.anchorRouterLink,
              primary: true,
            }, {
              label: T('Boot Environments Guide'),
              type: SmartAlertActionType.ExternalLink,
              icon: tnIconMarker('book-open-variant', 'mdi'),
              externalUrl: 'https://www.truenas.com/docs/scale/systemsettings/boot/managebootenviron/',
            }],
          },
        },
      ],
      defaultEnhancement: {
        // Regular data pool capacity - direct to Storage
        category: SmartAlertCategory.Storage,
        relatedMenuPath: ['storage'],
        groupSummary: T('{count, plural, other {# pools are critically low on free space}}'),
        contextualHelp: T('Storage pool capacity is critically high. Consider expanding capacity or cleaning up old data.'),
        actions: [{
          label: T('Go to Storage'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('dns', 'material'),
          route: ['/storage'],
          primary: true,
        }],
      },
    } satisfies ConditionalSmartAlertEnhancement,

    [AlertClassName.ZpoolCapacityWarning]: {
      conditions: [
        {
          // Boot pool capacity - direct to Boot Environments management
          check: (alert: Alert) => isBootPoolAlert(alert.args),
          enhancement: {
            category: SmartAlertCategory.System,
            relatedMenuPath: ['system', 'boot'],
            contextualHelp: T('Boot pool capacity is high. Consider cleaning up old boot environments to free up space.'),
            documentationUrl: 'https://www.truenas.com/docs/scale/systemsettings/boot/managebootenviron/',
            actions: [{
              label: T('Manage Boot Environments'),
              type: SmartAlertActionType.Navigate,
              icon: tnIconMarker('layers', 'mdi'),
              route: bootListElements.anchorRouterLink,
              primary: true,
            }, {
              label: T('Boot Environments Guide'),
              type: SmartAlertActionType.ExternalLink,
              icon: tnIconMarker('book-open-variant', 'mdi'),
              externalUrl: 'https://www.truenas.com/docs/scale/systemsettings/boot/managebootenviron/',
            }],
          },
        },
      ],
      defaultEnhancement: {
        // Regular data pool capacity - direct to Storage
        category: SmartAlertCategory.Storage,
        relatedMenuPath: ['storage'],
        groupSummary: T('{count, plural, other {# pools are running low on free space}}'),
        contextualHelp: T('Storage pool capacity is high. Monitor usage and consider expanding capacity.'),
        actions: [{
          label: T('Go to Storage'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('dns', 'material'),
          route: ['/storage'],
          primary: true,
        }],
      },
    } satisfies ConditionalSmartAlertEnhancement,

    [AlertClassName.ZpoolCapacityNotice]: {
      conditions: [
        {
          // Boot pool capacity - direct to Boot Environments management
          check: (alert: Alert) => isBootPoolAlert(alert.args),
          enhancement: {
            category: SmartAlertCategory.System,
            relatedMenuPath: ['system', 'boot'],
            contextualHelp: T('Boot pool usage is increasing. Consider reviewing and cleaning up old boot environments.'),
            documentationUrl: 'https://www.truenas.com/docs/scale/systemsettings/boot/managebootenviron/',
            actions: [{
              label: T('Manage Boot Environments'),
              type: SmartAlertActionType.Navigate,
              icon: tnIconMarker('layers', 'mdi'),
              route: bootListElements.anchorRouterLink,
              primary: true,
            }, {
              label: T('Boot Environments Guide'),
              type: SmartAlertActionType.ExternalLink,
              icon: tnIconMarker('book-open-variant', 'mdi'),
              externalUrl: 'https://www.truenas.com/docs/scale/systemsettings/boot/managebootenviron/',
            }],
          },
        },
      ],
      defaultEnhancement: {
        // Regular data pool capacity - direct to Storage
        category: SmartAlertCategory.Storage,
        relatedMenuPath: ['storage'],
        groupSummary: T('{count, plural, other {# pools are filling up}}'),
        contextualHelp: T('Storage pool usage is increasing. Monitor capacity trends.'),
        actions: [{
          label: T('Go to Storage'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('dns', 'material'),
          route: ['/storage'],
          primary: true,
        }],
      },
    } satisfies ConditionalSmartAlertEnhancement,

    [AlertClassName.VolumeStatus]: {
      category: SmartAlertCategory.Storage,
      relatedMenuPath: ['storage'],
      groupSummary: T('{count, plural, other {# pools are not healthy}}'),
      extractApiParams: () => {
        // VolumeStatus alerts only provide pool name in args.volume, not pool ID
        // Since we can't synchronously resolve pool name to ID, navigate to storage dashboard instead
        return undefined;
      },
      actions: [{
        label: T('View Storage'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('dns', 'material'),
        route: ['/storage'],
        primary: true,
      }],
    },

    [AlertClassName.PoolUsbDisks]: {
      category: SmartAlertCategory.Storage,
      relatedMenuPath: ['storage'],
      groupSummary: T('{count, plural, other {# pools have USB disks}}'),
      actions: [{
        label: T('Go to Storage'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('dns', 'material'),
        route: ['/storage'],
        primary: true,
      }],
    },

    // Snapshots
    [AlertClassName.SnapshotTotalCount]: {
      category: SmartAlertCategory.Storage,
      relatedMenuPath: ['datasets', 'snapshots'],
      actions: [{
        label: T('Go to Snapshots'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('camera', 'mdi'),
        route: ['/datasets', 'snapshots'],
        primary: true,
      }],
    },

    [AlertClassName.SnapshotCount]: {
      category: SmartAlertCategory.Storage,
      relatedMenuPath: ['datasets', 'snapshots'],
      groupSummary: T('{count, plural, other {# datasets have too many snapshots}}'),
      actions: [{
        label: T('Go to Snapshots'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('camera', 'mdi'),
        route: ['/datasets', 'snapshots'],
        primary: true,
      }],
    },

    // Local accounts
    [AlertClassName.AllAdminAccountsExpired]: {
      category: SmartAlertCategory.Security,
      relatedMenuPath: ['credentials', 'users'],
      contextualHelp: T('Every local full administrator account has expired. Renew one from the console or a session that is still authenticated, or you will be locked out.'),
      actions: [
        {
          label: T('Manage Users'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('account-multiple', 'mdi'),
          route: ['/credentials', 'users'],
          primary: true,
        },
      ],
    },

    [AlertClassName.LocalAccountExpired]: {
      category: SmartAlertCategory.Security,
      relatedMenuPath: ['credentials', 'users'],
      contextualHelp: T('One or more local accounts have expired and can no longer sign in. Renew or remove them.'),
      actions: [
        {
          label: T('Manage Users'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('account-multiple', 'mdi'),
          route: ['/credentials', 'users'],
          primary: true,
        },
      ],
    },

    [AlertClassName.LocalAccountExpiring]: {
      category: SmartAlertCategory.Security,
      relatedMenuPath: ['credentials', 'users'],
      contextualHelp: T('One or more local accounts must change their password soon or they will be locked out.'),
      actions: [
        {
          label: T('Manage Users'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('account-multiple', 'mdi'),
          route: ['/credentials', 'users'],
          primary: true,
        },
      ],
    },

    [AlertClassName.AdminSession]: {
      category: SmartAlertCategory.Security,
      relatedMenuPath: ['credentials', 'users'],
      contextualHelp: T('An administrator account signed in. Review the session if you did not expect this activity.'),
      actions: [
        {
          label: T('Manage Users'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('account-multiple', 'mdi'),
          route: ['/credentials', 'users'],
          primary: true,
        },
      ],
    },

    [AlertClassName.AdminUserIsOverridden]: {
      category: SmartAlertCategory.Security,
      relatedMenuPath: ['credentials', 'users'],
      contextualHelp: T('The built-in administrator account is overridden by a directory service account of the same name. Local sign-in for it will not work as expected.'),
      actions: [
        {
          label: T('Manage Users'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('account-multiple', 'mdi'),
          route: ['/credentials', 'users'],
          primary: true,
        },
      ],
    },

    [AlertClassName.SshLoginFailures]: {
      category: SmartAlertCategory.Security,
      relatedMenuPath: ['system', 'services'],
      contextualHelp: T('Repeated SSH sign-in failures were recorded. Check whether the SSH service should be reachable from where these attempts came from.'),
      actions: [
        {
          label: T('Go to Services'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('cog', 'mdi'),
          route: ['/system', 'services'],
          primary: true,
        },
      ],
    },

    [AlertClassName.FipsMisconfiguration]: {
      category: SmartAlertCategory.Security,
      relatedMenuPath: ['system', 'advanced'],
      contextualHelp: T('The FIPS settings on this system are inconsistent. Review the system security settings and apply a valid combination.'),
      actions: [
        {
          label: T('System Security Settings'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('shield-check', 'mdi'),
          route: ['/system', 'advanced'],
          primary: true,
        },
      ],
    },

    // API Keys
    ApiKeyRevoked: {
      category: SmartAlertCategory.Security,
      relatedMenuPath: ['credentials'],
      groupSummary: T('{count, plural, other {# API keys have been revoked}}'),
      bannerMenuPath: ['credentials', 'users', 'api-keys'],
      actions: [{
        label: T('Go to API keys'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('key', 'mdi'),
        route: ['/credentials', 'users', 'api-keys'],
        primary: true,
      }],
    },

    APIFailedLogin: {
      category: SmartAlertCategory.Security,
      relatedMenuPath: ['credentials'],
      bannerMenuPath: ['credentials', 'users', 'api-keys'],
      actions: [{
        label: T('Go to API keys'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('key', 'mdi'),
        route: ['/credentials', 'users', 'api-keys'],
        primary: true,
      }],
    },

    // Boot Pool
    [AlertClassName.BootPoolStatus]: {
      category: SmartAlertCategory.System,
      relatedMenuPath: ['system', 'boot'],
      actions: [{
        label: T('Go to Boot Pools'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('layers', 'mdi'),
        route: ['/system', 'boot'],
        primary: true,
      }],
    },

    // License - already covered by LicenseStatus source but adding class mappings
    [AlertClassName.LicenseHasExpired]: {
      category: SmartAlertCategory.System,
      relatedMenuPath: ['system', 'general'],
      actions: [{
        label: T('Go to System Settings'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('settings', 'material'),
        route: ['/system', 'general'],
        fragment: 'support',
        primary: true,
      }],
    },

    [AlertClassName.LicenseIsExpiring]: {
      category: SmartAlertCategory.System,
      relatedMenuPath: ['system', 'general'],
      actions: [{
        label: T('Go to System Settings'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('settings', 'material'),
        route: ['/system', 'general'],
        fragment: 'support',
        primary: true,
      }],
    },

    [AlertClassName.License]: {
      category: SmartAlertCategory.System,
      relatedMenuPath: ['system', 'general'],
      actions: [{
        label: T('Go to System Settings'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('settings', 'material'),
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
        icon: tnIconMarker('settings', 'material'),
        route: ['/system', 'general'],
        fragment: 'support',
        primary: true,
      }],
    },

    // System Updates
    [AlertClassName.HasUpdate]: {
      category: SmartAlertCategory.System,
      relatedMenuPath: ['system', 'update'],
      actions: [{
        label: T('Go to System Updates'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('update', 'mdi'),
        route: ['/system', 'update'],
        primary: true,
      }],
    },

    // System configuration
    [AlertClassName.CurrentlyRunningVersionDoesNotMatchProfile]: {
      category: SmartAlertCategory.System,
      relatedMenuPath: ['system', 'update'],
      contextualHelp: T('The running version does not match the selected update profile. Update to bring the system back onto its profile.'),
      actions: [
        {
          label: T('View Updates'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('update', 'mdi'),
          route: ['/system', 'update'],
          primary: true,
        },
      ],
    },

    [AlertClassName.GmailConfigurationDiscarded]: {
      category: SmartAlertCategory.System,
      relatedMenuPath: ['system', 'general'],
      contextualHelp: T('The GMail OAuth configuration was discarded, so TrueNAS can no longer send mail. Re-authorize the mail account.'),
      actions: [
        {
          label: T('Configure Email'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('email', 'mdi'),
          route: ['/system', 'general'],
          primary: true,
        },
      ],
    },

    [AlertClassName.TimezoneNotAvailable]: {
      category: SmartAlertCategory.System,
      relatedMenuPath: ['system', 'general'],
      contextualHelp: T('The configured timezone is not available in this release. Pick a supported timezone so schedules run at the expected time.'),
      actions: [
        {
          label: T('Go to General Settings'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('cog', 'mdi'),
          route: ['/system', 'general'],
          primary: true,
        },
      ],
    },

    [AlertClassName.InvalidGpuPciIds]: {
      category: SmartAlertCategory.System,
      relatedMenuPath: ['system', 'advanced'],
      contextualHelp: T('The isolated GPU list refers to PCI IDs that no longer exist. Update the list and reboot to apply it.'),
      actions: [
        {
          label: T('Go to Advanced Settings'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('cog', 'mdi'),
          route: ['/system', 'advanced'],
          primary: true,
        },
      ],
    },

    [AlertClassName.KdumpNotReady]: {
      category: SmartAlertCategory.System,
      relatedMenuPath: ['system', 'advanced'],
      contextualHelp: T('Kdump is enabled but not ready, so no crash dump would be captured if the kernel panics.'),
      actions: [
        {
          label: T('Go to Advanced Settings'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('cog', 'mdi'),
          route: ['/system', 'advanced'],
          primary: true,
        },
      ],
    },

    [AlertClassName.NtpHealthCheck]: {
      category: SmartAlertCategory.System,
      relatedMenuPath: ['system', 'advanced'],
      contextualHelp: T('The system clock is not synchronized with its NTP servers. Time drift breaks scheduled tasks, certificates and directory authentication.'),
      actions: [
        {
          label: T('Go to Advanced Settings'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('cog', 'mdi'),
          route: ['/system', 'advanced'],
          primary: true,
        },
      ],
    },

    [AlertClassName.SyslogNg]: {
      category: SmartAlertCategory.System,
      relatedMenuPath: ['system', 'advanced'],
      contextualHelp: T('syslog-ng is not running, so system logs are not being written or forwarded.'),
      actions: [
        {
          label: T('Go to Advanced Settings'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('cog', 'mdi'),
          route: ['/system', 'advanced'],
          primary: true,
        },
      ],
    },

    [AlertClassName.SystemTesting]: {
      category: SmartAlertCategory.System,
      contextualHelp: T('This system has mocking endpoints enabled. They are for testing only and must not be left on in production.'),
      actions: [],
    },

    // Data Protection - already have CloudBackupTaskFailed, CloudSyncTaskFailed, ReplicationFailed
    [AlertClassName.ReplicationSuccess]: {
      category: SmartAlertCategory.Tasks,
      relatedMenuPath: ['data-protection', 'replication'],
      groupSummary: T('{count, plural, other {# replication tasks succeeded}}'),
      actions: [{
        label: T('Go to Data Protection'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('security', 'material'),
        route: ['/data-protection'],
        primary: true,
      }],
    },

    [AlertClassName.ScrubFinished]: {
      category: SmartAlertCategory.Storage,
      relatedMenuPath: ['storage'],
      groupSummary: T('{count, plural, other {Scrub finished on # pools}}'),
      actions: [{
        label: T('View Storage'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('dns', 'material'),
        route: ['/storage'],
        primary: true,
      }],
    },

    [AlertClassName.ScrubNotStarted]: {
      category: SmartAlertCategory.Storage,
      relatedMenuPath: ['storage'],
      groupSummary: T('{count, plural, other {Scrub did not start on # pools}}'),
      actions: [{
        label: T('View Storage'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('dns', 'material'),
        route: ['/storage'],
        primary: true,
      }],
    },

    [AlertClassName.RsyncSuccess]: {
      category: SmartAlertCategory.Tasks,
      relatedMenuPath: ['data-protection', 'rsync'],
      contextualHelp: T('The rsync task finished successfully.'),
      actions: [
        {
          label: T('View Rsync Tasks'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('sync', 'mdi'),
          route: ['/data-protection', 'rsync'],
          primary: true,
        },
      ],
    },

    [AlertClassName.ScrubStarted]: {
      category: SmartAlertCategory.Storage,
      relatedMenuPath: ['storage'],
      contextualHelp: T('A scrub started. It reads every block in the pool, so expect reduced performance until it finishes.'),
      actions: [
        {
          label: T('View Storage'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('dns', 'material'),
          route: ['/storage'],
          primary: true,
        },
      ],
    },

    [AlertClassName.CloudProviderRemoved]: {
      category: SmartAlertCategory.Tasks,
      relatedMenuPath: ['credentials', 'backup-credentials'],
      contextualHelp: T('A cloud provider was removed from TrueNAS. Tasks and credentials that used it will no longer run.'),
      actions: [
        {
          label: T('Check Credentials'),
          type: SmartAlertActionType.Navigate,
          icon: tnIconMarker('key-variant', 'mdi'),
          route: ['/credentials', 'backup-credentials'],
          primary: true,
        },
      ],
    },

    // VMware Snapshots
    VMWareLoginFailed: {
      category: SmartAlertCategory.Tasks,
      relatedMenuPath: ['data-protection', 'vmware-snapshots'],
      documentationUrl: 'https://www.truenas.com/docs/scale/dataprotection/creatingvmwaresnapshots/',
      actions: [{
        label: T('Go to VMWare Snapshots'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('camera', 'mdi'),
        route: ['/data-protection', 'vmware-snapshots'],
        primary: true,
      }],
    },

    VMWareSnapshotDeleteFailed: {
      category: SmartAlertCategory.Tasks,
      relatedMenuPath: ['data-protection', 'vmware-snapshots'],
      groupSummary: T('{count, plural, other {# VMware snapshots could not be deleted}}'),
      documentationUrl: 'https://www.truenas.com/docs/scale/dataprotection/creatingvmwaresnapshots/',
      actions: [{
        label: T('Go to VMWare Snapshots'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('camera', 'mdi'),
        route: ['/data-protection', 'vmware-snapshots'],
        primary: true,
      }],
    },

    VMWareSnapshotCreateFailed: {
      category: SmartAlertCategory.Tasks,
      relatedMenuPath: ['data-protection', 'vmware-snapshots'],
      groupSummary: T('{count, plural, other {# VMware snapshots could not be created}}'),
      documentationUrl: 'https://www.truenas.com/docs/scale/dataprotection/creatingvmwaresnapshots/',
      actions: [{
        label: T('Go to VMWare Snapshots'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('camera', 'mdi'),
        route: ['/data-protection', 'vmware-snapshots'],
        primary: true,
      }],
    },

    // TrueCommand and TrueNAS Connect are reached from the topbar, not a route, so these
    // alerts badge no menu and link out to the service instead.
    [AlertClassName.TruecommandConnectionPending]: {
      category: SmartAlertCategory.System,
      contextualHelp: T('The TrueCommand API key is waiting for confirmation in the iX Portal. Approve it there to finish connecting.'),
      actions: [
        {
          label: T('Open TrueCommand'),
          type: SmartAlertActionType.ExternalLink,
          icon: tnIconMarker('cloud-outline', 'mdi'),
          externalUrl: 'https://portal.truenas.com',
          primary: true,
        },
      ],
    },

    [AlertClassName.TruecommandConnectionDisabled]: {
      category: SmartAlertCategory.System,
      contextualHelp: T('The TrueCommand API key was disabled in the iX Portal, so this system is no longer being managed.'),
      actions: [
        {
          label: T('Open TrueCommand'),
          type: SmartAlertActionType.ExternalLink,
          icon: tnIconMarker('cloud-outline', 'mdi'),
          externalUrl: 'https://portal.truenas.com',
          primary: true,
        },
      ],
    },

    [AlertClassName.TruecommandConnectionHealth]: {
      category: SmartAlertCategory.System,
      contextualHelp: T('The TrueCommand service failed its scheduled health check.'),
      actions: [
        {
          label: T('Open TrueCommand'),
          type: SmartAlertActionType.ExternalLink,
          icon: tnIconMarker('cloud-outline', 'mdi'),
          externalUrl: 'https://portal.truenas.com',
          primary: true,
        },
      ],
    },

    [AlertClassName.TruecommandContainerHealth]: {
      category: SmartAlertCategory.System,
      contextualHelp: T('The TrueCommand container failed its scheduled health check.'),
      actions: [
        {
          label: T('Open TrueCommand'),
          type: SmartAlertActionType.ExternalLink,
          icon: tnIconMarker('cloud-outline', 'mdi'),
          externalUrl: 'https://portal.truenas.com',
          primary: true,
        },
      ],
    },

    [AlertClassName.TncDisabledAutoUnconfigured]: {
      category: SmartAlertCategory.System,
      contextualHelp: T('TrueNAS Connect was disabled because the service is no longer configured.'),
      actions: [
        {
          label: T('Open TrueNAS Connect'),
          type: SmartAlertActionType.ExternalLink,
          icon: tnIconMarker('cloud-outline', 'mdi'),
          externalUrl: 'https://connect.truenas.com/',
          primary: true,
        },
      ],
    },

    [AlertClassName.TncHeartbeatConnectionFailure]: {
      category: SmartAlertCategory.System,
      contextualHelp: T('This system cannot reach the TrueNAS Connect heartbeat service. Check outbound network access.'),
      actions: [
        {
          label: T('Open TrueNAS Connect'),
          type: SmartAlertActionType.ExternalLink,
          icon: tnIconMarker('cloud-outline', 'mdi'),
          externalUrl: 'https://connect.truenas.com/',
          primary: true,
        },
      ],
    },

    // UPS
    UPSCommbad: {
      category: SmartAlertCategory.Hardware,
      relatedMenuPath: ['system', 'services'],
      documentationUrl: 'https://www.truenas.com/docs/scale/systemsettings/services/upsservicesscale/',
      actions: [{
        label: T('Go to UPS service'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('flash', 'mdi'),
        route: ['/system', 'services'],
        fragment: 'ups',
        primary: true,
      }],
    },

    [AlertClassName.UpsBatteryLow]: {
      category: SmartAlertCategory.Hardware,
      relatedMenuPath: ['system', 'services'],
      contextualHelp: T('The UPS battery is low. Shut down or restore mains power before it runs out.'),
      documentationUrl: 'https://www.truenas.com/docs/scale/systemsettings/services/upsservicesscale/',
      actions: [{
        label: T('Go to UPS service'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('flash', 'mdi'),
        route: ['/system', 'services'],
        fragment: 'ups',
        primary: true,
      }],
    },

    [AlertClassName.UpsReplaceBattery]: {
      category: SmartAlertCategory.Hardware,
      relatedMenuPath: ['system', 'services'],
      contextualHelp: T('The UPS reports that its battery needs replacing. It may not carry the system through the next outage.'),
      documentationUrl: 'https://www.truenas.com/docs/scale/systemsettings/services/upsservicesscale/',
      actions: [{
        label: T('Go to UPS service'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('flash', 'mdi'),
        route: ['/system', 'services'],
        fragment: 'ups',
        primary: true,
      }],
    },

    [AlertClassName.UpsOnBattery]: {
      category: SmartAlertCategory.Hardware,
      relatedMenuPath: ['system', 'services'],
      contextualHelp: T('Mains power was lost and the system is running on UPS battery.'),
      documentationUrl: 'https://www.truenas.com/docs/scale/systemsettings/services/upsservicesscale/',
      actions: [{
        label: T('Go to UPS service'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('flash', 'mdi'),
        route: ['/system', 'services'],
        fragment: 'ups',
        primary: true,
      }],
    },

    [AlertClassName.UpsOnline]: {
      category: SmartAlertCategory.Hardware,
      relatedMenuPath: ['system', 'services'],
      contextualHelp: T('Mains power was restored and the UPS is back on line power.'),
      documentationUrl: 'https://www.truenas.com/docs/scale/systemsettings/services/upsservicesscale/',
      actions: [{
        label: T('Go to UPS service'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('flash', 'mdi'),
        route: ['/system', 'services'],
        fragment: 'ups',
        primary: true,
      }],
    },

    [AlertClassName.UpsCommunicationOk]: {
      category: SmartAlertCategory.Hardware,
      relatedMenuPath: ['system', 'services'],
      contextualHelp: T('Communication with the UPS was restored.'),
      documentationUrl: 'https://www.truenas.com/docs/scale/systemsettings/services/upsservicesscale/',
      actions: [{
        label: T('Go to UPS service'),
        type: SmartAlertActionType.Navigate,
        icon: tnIconMarker('flash', 'mdi'),
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
        icon: tnIconMarker('dns', 'material'),
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
        icon: tnIconMarker('account-multiple', 'mdi'),
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
        icon: tnIconMarker('server', 'mdi'),
        route: ['/system', 'viewenclosure'],
        primary: true,
      },
      {
        label: T('Contact Support'),
        type: SmartAlertActionType.ExternalLink,
        icon: tnIconMarker('help-circle', 'mdi'),
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
        icon: tnIconMarker('certificate', 'mdi'),
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
        icon: tnIconMarker('network', 'mdi'),
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
        icon: tnIconMarker('settings', 'material'),
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
        icon: tnIconMarker('apps', 'material'),
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
        icon: tnIconMarker('security', 'material'),
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
        icon: tnIconMarker('update', 'mdi'),
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
        icon: tnIconMarker('server', 'mdi'),
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
      if (isDevMode()) {
        console.warn('Conditional enhancement found but no alert object provided. Using default enhancement.');
      }
      return enhancement.defaultEnhancement;
    }
    return resolveConditionalEnhancement(enhancement, alert);
  }

  return enhancement;
}
