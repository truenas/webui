import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const datasetDetailsPanelElements = {
  hierarchy: [T('Datasets')],
  anchorRouterLink: ['/datasets', '*'],
  synonyms: [T('View Datasets')],
  elements: {
    addZvol: {
      hierarchy: [T('Add Zvol')],
      synonyms: [T('Add Volume'), T('Create Zvol'), T('New Zvol')],
    },
    addDataset: {
      hierarchy: [T('Add Dataset')],
      synonyms: [T('Add Filesystem'), T('Create Dataset'), T('New Dataset')],
    },
    datasetDetailsCard: {
      hierarchy: [T('Details')],
      synonyms: [T('Dataset Information')],
      inset: true,
    },
    datasetCapacityCard: {
      hierarchy: [T('Space Management')],
      synonyms: [T('Dataset Capacity Management')],
      inset: true,
    },
    datasetDataProtectionCard: {
      hierarchy: [T('Data Protection')],
      synonyms: [T('Dataset Data Protection')],
      inset: true,
    },
    datasetZfsEncryptionCard: {
      hierarchy: [T('Encryption')],
      synonyms: [T('Dataset Encryption')],
      inset: true,
    },
    datasetRolesCard: {
      hierarchy: [T('Roles')],
      synonyms: [T('Dataset Roles')],
      inset: true,
    },
    datasetPermissionsCard: {
      hierarchy: [T('Permissions')],
      synonyms: [T('Dataset Permissions'), T('ACL')],
      inset: true,
    },
  },
} satisfies UiSearchableElement;
