export enum PoolCreationWizardStep {
  General = 'general',
  EnclosureOptions = 'enclosure',
  Data = 'data',
  Log = 'log',
  Spare = 'spare',
  Cache = 'cache',
  Metadata = 'metadata',
  Dedup = 'dedup',
  Review = 'review',
}

export type PoolCreationWizardRequiredStep = PoolCreationWizardStep.General
| PoolCreationWizardStep.EnclosureOptions
| PoolCreationWizardStep.Data;
