import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const manageConfigurationElements = {
  hierarchy: [T('System'), T('General Settings'), T('Manage Configuration')],
  anchorRouterLink: ['/system', 'general'],
  triggerAnchor: 'manage-configuration',
  elements: {
    manageConfiguration: {
      anchor: 'manage-configuration',
    },
    downloadFile: {
      hierarchy: [T('Download File')],
      synonyms: [
        T('Export File'),
        T('Export Configuration'),
        T('Download Configuration'),
        T('Export Config'),
        T('Save Config'),
        T('Download Config'),
        T('Backup Config'),
      ],
    },
    uploadFile: {
      hierarchy: [T('Upload File')],
      synonyms: [
        T('Import File'),
        T('Import Configuration'),
        T('Upload Configuration'),
        T('Import Config'),
        T('Upload Config'),
        T('Restore Config'),
      ],
    },
    resetToDefaults: {
      hierarchy: [T('Reset to Defaults')],
      synonyms: [
        T('Restore Defaults'),
        T('Reset Defaults'),
        T('Restore Default Config'),
        T('Reset Default Config'),
        T('Reset Config'),
        T('Restore Config Defaults'),
        T('Restore Default Configuration'),
      ],
    },
  },
} satisfies UiSearchableElement;
