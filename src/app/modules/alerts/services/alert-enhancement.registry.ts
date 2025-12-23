import { marker as T } from 'app/helpers/translate.helper';
import {
  SmartAlertAction,
  SmartAlertActionType,
  SmartAlertCategory,
  SmartAlertConfig,
  SmartAlertEnhancement,
  createFragmentExtractor,
  createTaskIdExtractor,
} from 'app/interfaces/smart-alert.interface';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';

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
          type: SmartAlertActionType.ApiCall,
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
      actions: [
        {
          label: T('Rerun Cloud Sync'),
          type: SmartAlertActionType.ApiCall,
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
      actions: [
        {
          label: T('Rerun Replication'),
          type: SmartAlertActionType.ApiCall,
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
      actions: [
        {
          label: T('Rerun Rsync Task'),
          type: SmartAlertActionType.ApiCall,
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
 */
export function getAlertEnhancement(
  source: string,
  klass?: string,
  alertText?: string,
): SmartAlertEnhancement | null {
  // Try to match by source first
  if (smartAlertRegistry.bySource?.[source]) {
    return smartAlertRegistry.bySource[source];
  }

  // Try to match by class
  if (klass && smartAlertRegistry.byClass?.[klass]) {
    return smartAlertRegistry.byClass[klass];
  }

  // Fallback: try pattern-based categorization
  // Pattern matches provide category, path, and optional default actions
  if (alertText) {
    for (const rule of patternCategories) {
      if (rule.patterns.some((pattern) => pattern.test(alertText))) {
        return {
          category: rule.category,
          relatedMenuPath: rule.relatedMenuPath,
          actions: rule.actions || [],
        };
      }
    }
  }

  return null;
}
