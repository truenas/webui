import {
  SmartAlertActionType,
  SmartAlertCategory,
  SmartAlertConfig,
  SmartAlertEnhancement,
} from 'app/interfaces/smart-alert.interface';

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
      documentationUrl: 'https://www.truenas.com/docs/scale/scaletutorials/systemsettings/general/managesupport/',
      actions: [
        {
          label: 'Update License',
          type: SmartAlertActionType.Navigate,
          icon: 'mdi-license',
          route: ['/system', 'general'],
          fragment: 'support',
          primary: true,
        },
        {
          label: 'Contact Support',
          type: SmartAlertActionType.ExternalLink,
          icon: 'mdi-help-circle',
          externalUrl: 'https://support.ixsystems.com',
        },
        {
          label: 'View Documentation',
          type: SmartAlertActionType.ExternalLink,
          icon: 'mdi-book-open-variant',
          externalUrl: 'https://www.truenas.com/docs/scale/scaletutorials/systemsettings/general/managesupport/',
        },
      ],
    },

    ProactiveSupport: {
      category: SmartAlertCategory.System,
      relatedMenuPath: ['system', 'general'],
      contextualHelp: 'Proactive Support helps iXsystems monitor your system health and provide early warnings. Configuration takes just a few minutes.',
      documentationUrl: 'https://www.truenas.com/docs/scale/scaletutorials/systemsettings/general/managesupport/',
      actions: [
        {
          label: 'Configure Support',
          type: SmartAlertActionType.Navigate,
          icon: 'mdi-cog',
          route: ['/system', 'general'],
          fragment: 'support',
          primary: true,
        },
        {
          label: 'Learn More',
          type: SmartAlertActionType.ExternalLink,
          icon: 'mdi-information',
          externalUrl: 'https://www.truenas.com/docs/scale/scaletutorials/systemsettings/general/managesupport/',
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
          icon: 'mdi-license',
          route: ['/system', 'general'],
          fragment: 'support',
          primary: true,
        },
        {
          label: 'Contact Support',
          type: SmartAlertActionType.ExternalLink,
          icon: 'mdi-help-circle',
          externalUrl: 'https://support.ixsystems.com',
        },
        {
          label: 'View Documentation',
          type: SmartAlertActionType.ExternalLink,
          icon: 'mdi-book-open-variant',
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
      documentationUrl: 'https://www.truenas.com/docs/scale/scaletutorials/credentials/certificates/',
      actions: [
        {
          label: 'Manage Certificates',
          type: SmartAlertActionType.Navigate,
          icon: 'mdi-certificate',
          route: ['/credentials', 'certificates'],
          primary: true,
        },
        {
          label: 'Certificate Guide',
          type: SmartAlertActionType.ExternalLink,
          icon: 'mdi-book-open-variant',
          externalUrl: 'https://www.truenas.com/docs/scale/scaletutorials/credentials/certificates/',
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
      documentationUrl: 'https://www.truenas.com/docs/scale/scaletutorials/storage/',
      actions: [
        {
          label: 'View Storage',
          type: SmartAlertActionType.Navigate,
          icon: 'mdi-database',
          route: ['/storage'],
          primary: true,
        },
        {
          label: 'Pool Status',
          type: SmartAlertActionType.Navigate,
          icon: 'mdi-information',
          route: ['/storage'],
        },
        {
          label: 'Troubleshooting Guide',
          type: SmartAlertActionType.ExternalLink,
          icon: 'mdi-book-open-variant',
          externalUrl: 'https://www.truenas.com/docs/scale/scaletutorials/storage/pools/poolstatus/',
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
          icon: 'mdi-database',
          route: ['/storage'],
          primary: true,
        },
        {
          label: 'Capacity Management',
          type: SmartAlertActionType.ExternalLink,
          icon: 'mdi-book-open-variant',
          externalUrl: 'https://www.truenas.com/docs/scale/scaletutorials/storage/pools/',
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
          icon: 'mdi-network',
          route: ['/network'],
          primary: true,
        },
        {
          label: 'IPMI Configuration',
          type: SmartAlertActionType.Navigate,
          icon: 'mdi-lan',
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
          icon: 'mdi-cog',
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
          icon: 'mdi-application',
          route: ['/apps', 'installed'],
          primary: true,
        },
        {
          label: 'App Troubleshooting',
          type: SmartAlertActionType.ExternalLink,
          icon: 'mdi-book-open-variant',
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
          icon: 'mdi-update',
          route: ['/system', 'update'],
          primary: true,
        },
        {
          label: 'Release Notes',
          type: SmartAlertActionType.ExternalLink,
          icon: 'mdi-note-text',
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
          icon: 'mdi-cloud-sync',
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
          icon: 'mdi-sync',
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
          icon: 'mdi-broom',
          route: ['/data-protection', 'scrub'],
          primary: true,
        },
        {
          label: 'Pool Status',
          type: SmartAlertActionType.Navigate,
          icon: 'mdi-information',
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
          icon: 'mdi-server',
          route: ['/system', 'view-enclosure'],
          primary: true,
        },
        {
          label: 'Contact Support',
          type: SmartAlertActionType.ExternalLink,
          icon: 'mdi-help-circle',
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
          icon: 'mdi-flash',
          route: ['/system', 'ups'],
          primary: true,
        },
      ],
    },
  },

  byClass: {
    // Additional mappings by AlertClassName can be added here
    // These will override or extend bySource mappings
  },

  byLevel: {
    // Default actions for all alerts of a certain level
    // These are applied if no specific source/class match is found
  },
};

/**
 * Helper function to get enhancement for an alert
 */
export function getAlertEnhancement(
  source: string,
  klass?: string,
): SmartAlertEnhancement | null {
  // Try to match by source first
  if (smartAlertRegistry.bySource?.[source]) {
    return smartAlertRegistry.bySource[source];
  }

  // Try to match by class
  if (klass && smartAlertRegistry.byClass?.[klass]) {
    return smartAlertRegistry.byClass[klass];
  }

  return null;
}
