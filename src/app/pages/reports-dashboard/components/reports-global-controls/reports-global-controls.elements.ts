import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';
import { ReportType } from 'app/pages/reports-dashboard/interfaces/report-tab.interface';

export const reportingGlobalControlsElements = {
  hierarchy: [T('Reporting')],
  anchorRouterLink: ['/reportsdashboard'],
  triggerAnchor: 'select-reporting',
  elements: {
    selectReporting: {
      hierarchy: [T('Select Reporting')],
      anchor: 'select-reporting',
    },
    [ReportType.Cpu]: {
      hierarchy: [T('CPU')],
      synonyms: [T('Processor')],
      anchorRouterLink: ['/reportsdashboard', 'cpu'],
    },
    [ReportType.Disk]: {
      hierarchy: [T('Disk')],
      synonyms: [T('Device')],
      anchorRouterLink: ['/reportsdashboard', 'disk'],
    },
    [ReportType.Memory]: {
      hierarchy: [T('Memory')],
      synonyms: [T('RAM')],
      anchorRouterLink: ['/reportsdashboard', 'memory'],
    },
    [ReportType.Network]: {
      hierarchy: [T('Network')],
      anchorRouterLink: ['/reportsdashboard', 'network'],
    },
    [ReportType.Nfs]: {
      hierarchy: [T('NFS')],
      anchorRouterLink: ['/reportsdashboard', 'nfs'],
    },
    [ReportType.Partition]: {
      hierarchy: [T('Partition')],
      anchorRouterLink: ['/reportsdashboard', 'partition'],
    },
    [ReportType.System]: {
      hierarchy: [T('System')],
      anchorRouterLink: ['/reportsdashboard', 'system'],
    },
    [ReportType.Target]: {
      hierarchy: [T('Target')],
      anchorRouterLink: ['/reportsdashboard', 'target'],
    },
    [ReportType.Ups]: {
      hierarchy: [T('UPS')],
      anchorRouterLink: ['/reportsdashboard', 'ups'],
    },
    [ReportType.Zfs]: {
      hierarchy: [T('ZFS')],
      anchorRouterLink: ['/reportsdashboard', 'zfs'],
    },
  },
} satisfies UiSearchableElement;
