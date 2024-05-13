import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const servicesElements = {
  hierarchy: [T('System'), T('Services')],
  anchorRouterLink: ['/system', 'services'],
  elements: {
    services: {},
  },
  manualRenderElements: {
    smb: {
      hierarchy: [T('SMB')],
      anchor: 'service-smb',
    },
    ftp: {
      hierarchy: [T('FTP')],
      anchor: 'service-ftp',
    },
    iscsi: {
      hierarchy: [T('iSCSI')],
      anchor: 'service-iscsi',
    },
    nfs: {
      hierarchy: [T('NFS')],
      anchor: 'service-nfs',
    },
    snmp: {
      hierarchy: [T('SNMP')],
      anchor: 'service-snmp',
    },
    ssh: {
      hierarchy: [T('SSH')],
      anchor: 'service-ssh',
    },
    ups: {
      hierarchy: [T('UPS')],
      anchor: 'service-ups',
    },
    smart: {
      hierarchy: [T('S.M.A.R.T.')],
      anchor: 'service-s.m.a.r.t.',
      synonyms: [T('Smart')],
    },
  },
} satisfies UiSearchableElement;
