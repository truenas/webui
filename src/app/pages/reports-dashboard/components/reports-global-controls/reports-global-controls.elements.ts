import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';
import { ReportType } from 'app/pages/reports-dashboard/interfaces/report-tab.interface';

export const reportingGlobalControlsElements = {
  hierarchy: [T('Reporting')],
  anchorRouterLink: ['/reportsdashboard'],
  elements: {
    selectReporting: {
      hierarchy: [T('Select Reporting')],
      anchor: 'select-reporting',
    },
    [ReportType.Cpu]: {
      hierarchy: [T('CPU')],
      synonyms: [T('Processor'), T('CPU Stats'), T('CPU Utilization')],
      anchorRouterLink: ['/reportsdashboard', 'cpu'],
    },
    [ReportType.Disk]: {
      hierarchy: [T('Disk')],
      synonyms: [T('Device'), T('Disks'), T('Disk IO'), T('Disk I/O'), T('disk stats'), T('disk writes')],
      anchorRouterLink: ['/reportsdashboard', 'disk'],
    },
    [ReportType.Memory]: {
      hierarchy: [T('Memory')],
      synonyms: [T('RAM'), T('Free RAM'), T('Memory Usage'), T('Memory Stats'), T('Memory Utilization')],
      anchorRouterLink: ['/reportsdashboard', 'memory'],
    },
    [ReportType.Network]: {
      hierarchy: [T('Network')],
      synonyms: [T('Network Stats'), T('Network Utilization'), T('Network Usage'), T('Traffic'), T('Network Traffic')],
      anchorRouterLink: ['/reportsdashboard', 'network'],
    },
    [ReportType.System]: {
      hierarchy: [T('System')],
      synonyms: [T('System Stats'), T('System Utilization'), T('Uptime')],
      anchorRouterLink: ['/reportsdashboard', 'system'],
    },
    [ReportType.Target]: {
      hierarchy: [T('Target')],
      synonyms: [T('Target Stats'), T('Target Utilization')],
      anchorRouterLink: ['/reportsdashboard', 'target'],
    },
    [ReportType.Ups]: {
      hierarchy: [T('UPS')],
      synonyms: [T('UPS Stats'), T('UPS Utilization')],
      anchorRouterLink: ['/reportsdashboard', 'ups'],
    },
    [ReportType.Zfs]: {
      hierarchy: [T('ZFS')],
      synonyms: [T('ZFS Reports'), T('ZFS Stats'), T('ZFS Utilization')],
      anchorRouterLink: ['/reportsdashboard', 'zfs'],
    },
  },
} satisfies UiSearchableElement;
