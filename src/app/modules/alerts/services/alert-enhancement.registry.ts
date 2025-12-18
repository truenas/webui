import {
  SmartAlertAction,
  SmartAlertActionType,
  SmartAlertCategory,
  SmartAlertConfig,
  SmartAlertEnhancement,
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
      contextualHelp: 'License issues can affect system features and support eligibility. Update your license to restore full functionality.',
      documentationUrl: 'https://www.truenas.com/docs/scale/scaletutorials/systemsettings/general/addlicenseproactivesupport/',
      actions: [
        {
          label: 'Update License',
          type: SmartAlertActionType.Navigate,
          icon: iconMarker('mdi-license'),
          route: ['/system', 'general'],
          fragment: 'support',
          primary: true,
        },
        {
          label: 'Contact Support',
          type: SmartAlertActionType.ExternalLink,
          icon: iconMarker('mdi-help-circle'),
          externalUrl: 'https://support.ixsystems.com',
        },
        {
          label: 'View Documentation',
          type: SmartAlertActionType.ExternalLink,
          icon: iconMarker('mdi-book-open-variant'),
          externalUrl: 'https://www.truenas.com/docs/scale/scaletutorials/systemsettings/general/addlicenseproactivesupport/',
        },
      ],
    },

    ProactiveSupport: {
      category: SmartAlertCategory.System,
      relatedMenuPath: ['system', 'general'],
      contextualHelp: 'Proactive Support helps iXsystems monitor your system health and provide early warnings. Configuration takes just a few minutes.',
      documentationUrl: 'https://www.truenas.com/docs/scale/scaletutorials/systemsettings/general/addlicenseproactivesupport/',
      actions: [
        {
          label: 'Configure Support',
          type: SmartAlertActionType.Navigate,
          icon: iconMarker('mdi-cog'),
          route: ['/system', 'general'],
          fragment: 'support',
          primary: true,
        },
        {
          label: 'Learn More',
          type: SmartAlertActionType.ExternalLink,
          icon: iconMarker('mdi-information'),
          externalUrl: 'https://www.truenas.com/docs/scale/scaletutorials/systemsettings/general/addlicenseproactivesupport/',
        },
      ],
    },

    UnsupportedHardware: {
      category: SmartAlertCategory.Hardware,
      relatedMenuPath: ['system', 'general'],
      contextualHelp: 'Your system is running on hardware that is not officially supported by iXsystems. This may affect stability, performance, and support eligibility.',
      documentationUrl: 'https://www.truenas.com/docs/scale/gettingstarted/scalehardwareguide/',
      actions: [
        {
          label: 'Update License',
          type: SmartAlertActionType.Navigate,
          icon: iconMarker('mdi-license'),
          route: ['/system', 'general'],
          fragment: 'support',
          primary: true,
        },
        {
          label: 'Contact Support',
          type: SmartAlertActionType.ExternalLink,
          icon: iconMarker('mdi-help-circle'),
          externalUrl: 'https://support.ixsystems.com',
        },
        {
          label: 'View Documentation',
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
      contextualHelp: 'Certificate issues can prevent secure connections and service access. Review and renew certificates before expiration.',
      documentationUrl: 'https://www.truenas.com/docs/scale/scaletutorials/credentials/certificates/certificatesscale/',
      actions: [
        {
          label: 'Manage Certificates',
          type: SmartAlertActionType.Navigate,
          icon: iconMarker('mdi-certificate'),
          route: ['/credentials', 'certificates'],
          primary: true,
        },
        {
          label: 'Certificate Guide',
          type: SmartAlertActionType.ExternalLink,
          icon: iconMarker('mdi-book-open-variant'),
          externalUrl: 'https://www.truenas.com/docs/scale/scaletutorials/credentials/certificates/certificatesscale/',
        },
      ],
    },

    /**
     * Storage and Pool Alerts
     */
    VolumeStatus: {
      category: SmartAlertCategory.Storage,
      relatedMenuPath: ['storage'],
      contextualHelp: 'Storage pool health is critical for data integrity. Investigate and resolve pool issues immediately to prevent data loss.',
      detailedHelp: 'Common pool issues include: degraded pools (missing/failed drives), scrub errors, capacity warnings, and replication problems.',
      documentationUrl: 'https://www.truenas.com/docs/scale/scaletutorials/storage/managepoolsscale/',
      actions: [
        {
          label: 'View Storage',
          type: SmartAlertActionType.Navigate,
          icon: iconMarker('mdi-database'),
          route: ['/storage'],
          primary: true,
        },
        {
          label: 'Managing Pools Guide',
          type: SmartAlertActionType.ExternalLink,
          icon: iconMarker('mdi-book-open-variant'),
          externalUrl: 'https://www.truenas.com/docs/scale/scaletutorials/storage/managepoolsscale/',
        },
        {
          label: 'Storage Documentation',
          type: SmartAlertActionType.ExternalLink,
          icon: iconMarker('mdi-help-circle'),
          externalUrl: 'https://www.truenas.com/docs/scale/scaletutorials/storage/',
        },
      ],
    },

    PoolCapacity: {
      category: SmartAlertCategory.Storage,
      relatedMenuPath: ['storage'],
      contextualHelp: 'High pool usage can impact performance and prevent new data writes. Consider expanding capacity or cleaning up old data.',
      actions: [
        {
          label: 'View Storage',
          type: SmartAlertActionType.Navigate,
          icon: iconMarker('mdi-database'),
          route: ['/storage'],
          primary: true,
        },
        {
          label: 'Managing Pools Guide',
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
      relatedMenuPath: ['network'],
      contextualHelp: 'IPMI connectivity issues can prevent remote management. Check network configuration and IPMI settings.',
      documentationUrl: 'https://www.truenas.com/docs/scale/scaletutorials/network/',
      actions: [
        {
          label: 'Network Settings',
          type: SmartAlertActionType.Navigate,
          icon: iconMarker('mdi-network'),
          route: ['/network'],
          primary: true,
        },
        {
          label: 'IPMI Configuration',
          type: SmartAlertActionType.Navigate,
          icon: iconMarker('mdi-lan'),
          route: ['/network', 'ipmi'],
        },
      ],
    },

    /**
     * Service Alerts
     */
    ServiceMonitor: {
      category: SmartAlertCategory.Services,
      relatedMenuPath: ['services'],
      contextualHelp: 'Service failures can interrupt critical functionality. Review service logs and configuration to identify the cause.',
      actions: [
        {
          label: 'View Services',
          type: SmartAlertActionType.Navigate,
          icon: iconMarker('mdi-cog'),
          route: ['/services'],
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
      contextualHelp: 'Application issues may be caused by misconfiguration, resource constraints, or storage problems.',
      documentationUrl: 'https://www.truenas.com/docs/scale/scaletutorials/apps/',
      actions: [
        {
          label: 'View Applications',
          type: SmartAlertActionType.Navigate,
          icon: iconMarker('mdi-application'),
          route: ['/apps', 'installed'],
          primary: true,
        },
        {
          label: 'App Troubleshooting',
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
      contextualHelp: 'System updates include security patches, bug fixes, and new features. Review release notes before updating.',
      documentationUrl: 'https://www.truenas.com/docs/scale/gettingstarted/scaleupgrades/',
      actions: [
        {
          label: 'View Updates',
          type: SmartAlertActionType.Navigate,
          icon: iconMarker('mdi-update'),
          route: ['/system', 'update'],
          primary: true,
        },
        {
          label: 'Release Notes',
          type: SmartAlertActionType.ExternalLink,
          icon: iconMarker('mdi-note-text'),
          externalUrl: 'https://www.truenas.com/docs/scale/gettingstarted/scalereleasenotes/',
        },
      ],
    },

    /**
     * Task Alerts
     */
    CloudSyncTaskFailed: {
      category: SmartAlertCategory.Tasks,
      relatedMenuPath: ['data-protection', 'cloudsync'],
      contextualHelp: 'Cloud sync failures may be due to network issues, credential problems, or cloud provider limitations.',
      actions: [
        {
          label: 'View Cloud Sync Tasks',
          type: SmartAlertActionType.Navigate,
          icon: iconMarker('mdi-cloud-sync'),
          route: ['/data-protection', 'cloudsync'],
          primary: true,
        },
      ],
    },

    ReplicationTaskFailed: {
      category: SmartAlertCategory.Tasks,
      relatedMenuPath: ['data-protection', 'replication'],
      contextualHelp: 'Replication failures can cause backup gaps. Check network connectivity and destination system health.',
      actions: [
        {
          label: 'View Replication Tasks',
          type: SmartAlertActionType.Navigate,
          icon: iconMarker('mdi-sync'),
          route: ['/data-protection', 'replication'],
          primary: true,
        },
      ],
    },

    ScrubTaskFailed: {
      category: SmartAlertCategory.Storage,
      relatedMenuPath: ['data-protection', 'scrub'],
      contextualHelp: 'Scrub failures may indicate disk errors or pool corruption. Investigate pool health immediately.',
      actions: [
        {
          label: 'View Scrub Tasks',
          type: SmartAlertActionType.Navigate,
          icon: iconMarker('mdi-broom'),
          route: ['/data-protection', 'scrub'],
          primary: true,
        },
        {
          label: 'Pool Status',
          type: SmartAlertActionType.Navigate,
          icon: iconMarker('mdi-information'),
          route: ['/storage'],
        },
      ],
    },

    /**
     * Hardware Alerts
     */
    HardwareStatus: {
      category: SmartAlertCategory.Hardware,
      relatedMenuPath: ['system', 'view-enclosure'],
      contextualHelp: 'Hardware issues require immediate attention. Check system health, temperatures, and component status.',
      actions: [
        {
          label: 'View Enclosure',
          type: SmartAlertActionType.Navigate,
          icon: iconMarker('mdi-server'),
          route: ['/system', 'view-enclosure'],
          primary: true,
        },
        {
          label: 'Contact Support',
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
      relatedMenuPath: ['system', 'ups'],
      contextualHelp: 'UPS issues can affect power protection. Verify UPS connection and battery health.',
      actions: [
        {
          label: 'UPS Configuration',
          type: SmartAlertActionType.Navigate,
          icon: iconMarker('mdi-flash'),
          route: ['/system', 'ups'],
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
      contextualHelp: 'Cloud backup failures may be caused by network connectivity issues, insufficient cloud storage space, invalid credentials, or expired authentication tokens.',
      documentationUrl: 'https://www.truenas.com/docs/scale/scaletutorials/dataprotection/truecloudtasks/',
      actions: [
        {
          label: 'View Cloud Backup Tasks',
          type: SmartAlertActionType.Navigate,
          icon: iconMarker('mdi-cloud-upload'),
          route: ['/data-protection', 'cloud-backup'],
          primary: true,
        },
        {
          label: 'Cloud Credentials',
          type: SmartAlertActionType.Navigate,
          icon: iconMarker('mdi-key'),
          route: ['/credentials', 'backup-credentials'],
        },
        {
          label: 'Backup Documentation',
          type: SmartAlertActionType.ExternalLink,
          icon: iconMarker('mdi-book-open-variant'),
          externalUrl: 'https://www.truenas.com/docs/scale/scaletutorials/dataprotection/truecloudtasks/',
        },
      ],
    },

    ScrubPaused: {
      category: SmartAlertCategory.Storage,
      relatedMenuPath: ['storage'],
      contextualHelp: 'Pool scrub is paused or not running. This may be due to pool being offline or scrub task being manually paused.',
      actions: [
        {
          label: 'View Storage',
          type: SmartAlertActionType.Navigate,
          icon: iconMarker('dns'),
          route: ['/storage'],
          primary: true,
        },
        {
          label: 'View Scrub Tasks',
          type: SmartAlertActionType.Navigate,
          icon: iconMarker('mdi-broom'),
          route: ['/data-protection', 'scrub'],
        },
      ],
    },

    ScrubNotRunning: {
      category: SmartAlertCategory.Storage,
      relatedMenuPath: ['storage'],
      contextualHelp: 'Pool scrub is not running. This may be due to pool being offline or scrub task configuration issues.',
      actions: [
        {
          label: 'View Storage',
          type: SmartAlertActionType.Navigate,
          icon: iconMarker('dns'),
          route: ['/storage'],
          primary: true,
        },
        {
          label: 'View Scrub Tasks',
          type: SmartAlertActionType.Navigate,
          icon: iconMarker('mdi-broom'),
          route: ['/data-protection', 'scrub'],
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
  // Storage issues - check pool offline first (more specific)
  {
    patterns: [/pool.*offline/i, /pool.*degraded/i, /pool.*unavailable/i, /disk.*fail/i, /vdev.*fail/i],
    category: SmartAlertCategory.Storage,
    relatedMenuPath: ['storage'],
    actions: [
      {
        label: 'View Storage',
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('dns'),
        route: ['/storage'],
        primary: true,
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
        label: 'Manage Certificates',
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
    relatedMenuPath: ['network'],
    actions: [
      {
        label: 'Network Settings',
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('mdi-network'),
        route: ['/network'],
        primary: true,
      },
    ],
  },
  // Service issues
  {
    patterns: [/service.*fail/i, /service.*stop/i, /daemon/i],
    category: SmartAlertCategory.Services,
    relatedMenuPath: ['services'],
    actions: [
      {
        label: 'View Services',
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('settings'),
        route: ['/system', 'services'],
        primary: true,
      },
    ],
  },
  // Application issues
  {
    patterns: [/app.*fail/i, /container/i, /kubernetes/i, /docker/i],
    category: SmartAlertCategory.Applications,
    relatedMenuPath: ['apps'],
    actions: [
      {
        label: 'View Applications',
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('apps'),
        route: ['/apps', 'installed'],
        primary: true,
      },
    ],
  },
  // Task issues - scrub, backup, replication (less specific, comes after pool offline)
  {
    patterns: [/scrub.*fail/i, /scrub.*error/i, /backup.*fail/i, /replication.*fail/i, /snapshot/i, /sync.*fail/i],
    category: SmartAlertCategory.Tasks,
    relatedMenuPath: ['data-protection'],
    actions: [
      {
        label: 'Data Protection',
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('security'),
        route: ['/data-protection'],
        primary: true,
      },
    ],
  },
  // System updates
  {
    patterns: [/update.*available/i, /upgrade/i, /new version/i],
    category: SmartAlertCategory.System,
    relatedMenuPath: ['system', 'update'],
    actions: [
      {
        label: 'View Updates',
        type: SmartAlertActionType.Navigate,
        icon: iconMarker('mdi-update'),
        route: ['/system', 'update'],
        primary: true,
      },
    ],
  },
  // Hardware issues
  {
    patterns: [/hardware/i, /temperature/i, /fan/i, /power supply/i, /ups/i],
    category: SmartAlertCategory.Hardware,
    relatedMenuPath: ['system', 'view-enclosure'],
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
