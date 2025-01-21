import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { AlertClassName } from 'app/enums/alert-class-name.enum';
import { AlertLink } from 'app/modules/alerts/services/alert-link.interface';
import { installedAppsElements } from 'app/pages/apps/components/installed-apps/installed-apps.elements';
import {
  certificateListElements,
} from 'app/pages/credentials/certificates-dash/certificate-list/certificate-list.elements';
import { kmipElements } from 'app/pages/credentials/kmip/kmip.elements';
import { userApiKeysElements } from 'app/pages/credentials/users/user-api-keys/user-api-keys.elements';
import { dataProtectionDashboardElements } from 'app/pages/data-protection/data-protection-dashboard.elements';
import {
  vmwareSnapshotListElements,
} from 'app/pages/data-protection/vmware-snapshot/vmware-snapshot-list/vmware-snapshot-list.elements';
import {
  datasetManagementElements,
} from 'app/pages/datasets/components/dataset-management/dataset-management.elements';
import { snapshotListElements } from 'app/pages/datasets/modules/snapshots/snapshot-list/snapshot-list.elements';
import { directoryServicesElements } from 'app/pages/directory-service/directory-services.elements';
import { interfacesCardElements } from 'app/pages/network/components/interfaces-card/interfaces-card.elements';
import { servicesElements } from 'app/pages/services/services.elements';
import { smbListElements } from 'app/pages/sharing/smb/smb-list/smb-list.elements';
import { smbStatusElements } from 'app/pages/sharing/smb/smb-status/smb-status.elements';
import { diskListElements } from 'app/pages/storage/modules/disks/components/disk-list/disk-list.elements';
import { storageElements } from 'app/pages/storage/pools-dashboard.elements';
import { bootListElements } from 'app/pages/system/bootenv/bootenv-list/bootenv-list.elements';
import { jbofListElements } from 'app/pages/system/enclosure/components/jbof-list/jbof-list.elements';
import { failoverElements } from 'app/pages/system/failover-settings/failover-settings.elements';
import { guiCardElements } from 'app/pages/system/general-settings/gui/gui-card/gui-card.elements';
import { supportCardElements } from 'app/pages/system/general-settings/support/support-card/support-card.elements';
import { systemUpdateElements } from 'app/pages/system/update/update.elements';

interface SupportedLink {
  link: AlertLink;
  classes: AlertClassName[];
}

export const supportedLinks: SupportedLink[] = [
  {
    link: {
      label: T('Go to Applications'),
      route: installedAppsElements.anchorRouterLink,
    },
    classes: [
      AlertClassName.FailuresInAppMigration,
      AlertClassName.AppUpdate,
      AlertClassName.ApplicationsStartFailed,
    ],
  },
  {
    link: {
      label: T('Go to App Settings'),
      route: installedAppsElements.anchorRouterLink,
      hash: installedAppsElements.elements.installed.anchor,
    },
    classes: [AlertClassName.ApplicationsConfigurationFailed],
  },
  {
    link: {
      label: T('Go to Certificates'),
      route: certificateListElements.anchorRouterLink,
    },
    classes: [
      AlertClassName.CertificateExpired,
      AlertClassName.CertificateIsExpiring,
      AlertClassName.CertificateIsExpiringSoon,
      AlertClassName.CertificateParsingFailed,
      AlertClassName.CertificateRevoked,
    ],
  },
  {
    link: {
      label: T('Go to GUI Settings'),
      route: guiCardElements.anchorRouterLink,
      hash: guiCardElements.elements.settings.anchor,
    },
    classes: [
      AlertClassName.WebUiCertificateSetupFailed,
      AlertClassName.WebUiBindAddressV2,
    ],
  },
  {
    link: {
      label: T('Go To Directory Services'),
      route: directoryServicesElements.anchorRouterLink,
    },
    classes: [
      AlertClassName.ActiveDirectoryDomainBind,
      AlertClassName.ActiveDirectoryDomainHealth,
      AlertClassName.LdapBind,
    ],
  },
  {
    link: {
      label: T('Go to Network Interfaces'),
      route: interfacesCardElements.anchorRouterLink,
    },
    classes: [
      AlertClassName.NoCriticalFailoverInterfaceFound,
      AlertClassName.NetworkCardsMismatchOnActiveNode,
      AlertClassName.NetworkCardsMismatchOnStandbyNode,
      AlertClassName.BondMissingPorts,
      AlertClassName.BondInactivePorts,
      AlertClassName.BondNoActivePorts,
    ],
  },
  {
    link: {
      label: T('Go to Failover Settings'),
      route: failoverElements.anchorRouterLink,
    },
    classes: [
      AlertClassName.FailoverSyncFailed,
      AlertClassName.FailoverKeysSyncFailed,
    ],
  },
  {
    link: {
      label: T('Go to JBOF'),
      route: jbofListElements.anchorRouterLink,
    },
    classes: [
      AlertClassName.JbofRedfishComm,
      AlertClassName.JbofElementCritical,
      AlertClassName.JbofElementWarning,
      AlertClassName.JbofTearDownFailure,
      AlertClassName.JbofInvalidData,
    ],
  },
  {
    link: {
      label: T('Go to Disks'),
      route: diskListElements.anchorRouterLink,
    },
    classes: [AlertClassName.Smart],
  },
  {
    link: {
      label: T('Go to Services'),
      route: servicesElements.anchorRouterLink,
    },
    classes: [AlertClassName.Smartd],
  },
  {
    link: {
      label: T('Go to KMIP'),
      route: kmipElements.anchorRouterLink,
    },
    classes: [
      AlertClassName.KmipConnectionFailed,
      AlertClassName.KmipSedGlobalPasswordSyncFailure,
      AlertClassName.KmipSedDisksSyncFailure,
      AlertClassName.KmipZfsDatasetsSyncFailure,
    ],
  },
  {
    link: {
      label: T('Go to NFS Service'),
      route: servicesElements.anchorRouterLink,
      hash: servicesElements.manualRenderElements.nfs.anchor,
    },
    classes: [
      AlertClassName.NfsBindAddress,
    ],
  },
  {
    link: {
      label: T('Go to SMB shares'),
      route: smbListElements.anchorRouterLink,
    },
    classes: [
      AlertClassName.SmbPath,
    ],
  },
  {
    link: {
      label: T('Go to SMB sessions'),
      route: smbStatusElements.elements.sessions.anchorRouterLink,
    },
    classes: [
      AlertClassName.SmbLegacyProtocol,
    ],
  },
  {
    link: {
      label: T('Go to Datasets'),
      route: datasetManagementElements.anchorRouterLink,
    },
    classes: [
      AlertClassName.ShareLocked,
      AlertClassName.QuotaCritical,
      AlertClassName.QuotaWarning,
      AlertClassName.EncryptedDataset,
      AlertClassName.TaskLocked,
    ],
  },
  {
    link: {
      label: T('Go to Storage'),
      route: storageElements.anchorRouterLink,
    },
    classes: [
      AlertClassName.PoolUpgraded,
      AlertClassName.ZpoolCapacityCritical,
      AlertClassName.ZpoolCapacityWarning,
      AlertClassName.ZpoolCapacityNotice,
      AlertClassName.VolumeStatus,
      AlertClassName.PoolUsbDisks,
      AlertClassName.ScrubPaused,
    ],
  },
  {
    link: {
      label: T('Go to Snapshots'),
      route: snapshotListElements.anchorRouterLink,
    },
    classes: [
      AlertClassName.SnapshotTotalCount,
      AlertClassName.SnapshotCount,
    ],
  },
  {
    link: {
      label: T('Go to API keys'),
      route: userApiKeysElements.anchorRouterLink,
    },
    classes: [
      AlertClassName.ApiKeyRevoked,
      AlertClassName.ApiFailedLogin,
    ],
  },
  {
    link: {
      label: T('Go to Boot Pools'),
      route: bootListElements.anchorRouterLink,
    },
    classes: [
      AlertClassName.BootPoolStatus,
    ],
  },
  {
    link: {
      label: T('Go to Settings'),
      route: supportCardElements.anchorRouterLink,
    },
    classes: [
      AlertClassName.LicenseHasExpired,
      AlertClassName.LicenseIsExpiring,
      AlertClassName.License,
      AlertClassName.ProactiveSupport,
    ],
  },
  {
    link: {
      label: T('Go to System Updates'),
      route: systemUpdateElements.anchorRouterLink,
    },
    classes: [
      AlertClassName.HasUpdate,
    ],
  },
  {
    link: {
      label: T('Go to Data Protection'),
      route: dataProtectionDashboardElements.anchorRouterLink,
    },
    classes: [
      AlertClassName.CloudBackupTaskFailed,
      AlertClassName.CloudSyncTaskFailed,
      AlertClassName.ReplicationFailed,
      AlertClassName.ReplicationSuccess,
      AlertClassName.ScrubFinished,
      AlertClassName.ScrubNotStarted,
      AlertClassName.SnapshotFailed,
    ],
  },
  {
    link: {
      label: T('Go to VMWare Snapshots'),
      route: vmwareSnapshotListElements.anchorRouterLink,
    },
    classes: [
      AlertClassName.VmwareLoginFailed,
      AlertClassName.VmwareSnapshotDeleteFailed,
      AlertClassName.VmwareSnapshotTaskFailed,
    ],
  },
  {
    link: {
      label: T('Go to UPS service'),
      route: servicesElements.anchorRouterLink,
      hash: servicesElements.manualRenderElements.ups.anchor,
    },
    classes: [
      AlertClassName.UpsCommunicationBad,
    ],
  },
];
