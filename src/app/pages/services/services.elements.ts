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
      synonyms: [T('Samba'), T('SMB Service')],
      anchor: 'service-smb',
    },
    ftp: {
      hierarchy: [T('FTP')],
      synonyms: [T('FTP Service')],
      anchor: 'service-ftp',
    },
    iscsi: {
      hierarchy: [T('iSCSI')],
      synonyms: [T('iSCSI Service')],
      anchor: 'service-iscsi',
    },
    nfs: {
      hierarchy: [T('NFS')],
      synonyms: [T('NFS Service')],
      anchor: 'service-nfs',
    },
    snmp: {
      hierarchy: [T('SNMP')],
      synonyms: [T('SNMP Service')],
      anchor: 'service-snmp',
    },
    ssh: {
      hierarchy: [T('SSH')],
      synonyms: [T('SSH Service')],
      anchor: 'service-ssh',
    },
    ups: {
      hierarchy: [T('UPS')],
      synonyms: [T('UPS Service')],
      anchor: 'service-ups',
    },
    smart: {
      hierarchy: [T('S.M.A.R.T.')],
      synonyms: [T('Smart Service'), T('Smart')],
      anchor: 'service-smart',
    },
  },
} satisfies UiSearchableElement;
