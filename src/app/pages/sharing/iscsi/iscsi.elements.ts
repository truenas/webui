import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const iscsiElements = {
  hierarchy: [T('Sharing'), T('iSCSI')],
  elements: {
    configuration: {
      hierarchy: [T('Target Global Configuration')],
      anchorRouterLink: ['/sharing', 'iscsi', 'configuration'],
    },
    portals: {
      hierarchy: [T('Portals')],
      anchorRouterLink: ['/sharing', 'iscsi', 'portals'],
    },
    initiator: {
      hierarchy: [T('Initiators Groups')],
      anchorRouterLink: ['/sharing', 'iscsi', 'initiator'],
    },
    auth: {
      hierarchy: [T('Authorized Access')],
      anchorRouterLink: ['/sharing', 'iscsi', 'auth'],
    },
    target: {
      hierarchy: [T('Targets')],
      anchorRouterLink: ['/sharing', 'iscsi', 'target'],
    },
    extent: {
      hierarchy: [T('Extents')],
      anchorRouterLink: ['/sharing', 'iscsi', 'extent'],
    },
    associatedTarget: {
      hierarchy: [T('Associated Targets')],
      anchorRouterLink: ['/sharing', 'iscsi', 'associatedtarget'],
    },
  },
};
