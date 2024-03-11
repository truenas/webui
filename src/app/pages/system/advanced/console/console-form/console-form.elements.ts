import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const elements: Record<string, UiSearchableElement> = {
  consolemenu: {
    hierarchy: [T('System Settings'), T('Advanced'), T('Console'), T('Console Menu')],
    synonyms: [T('Show Text Console without Password Prompt')],
    triggerAnchor: 'console-settings',
    anchorRouterLink: ['/system', 'advanced'],
  },
  serialconsole: {
    hierarchy: [T('System Settings'), T('Advanced'), T('Console'), T('Enable Serial Console')],
    triggerAnchor: 'console-settings',
    anchorRouterLink: ['/system', 'advanced'],
  },
  serialport: {
    hierarchy: [T('System Settings'), T('Advanced'), T('Console'), T('Serial Port')],
    triggerAnchor: 'console-settings',
    anchorRouterLink: ['/system', 'advanced'],
  },
  serialspeed: {
    hierarchy: [T('System Settings'), T('Advanced'), T('Console'), T('Serial Speed')],
    triggerAnchor: 'console-settings',
    anchorRouterLink: ['/system', 'advanced'],
  },
  motd: {
    hierarchy: [T('System Settings'), T('Advanced'), T('Console'), T('MOTD Banner')],
    triggerAnchor: 'console-settings',
    anchorRouterLink: ['/system', 'advanced'],
  },
};
