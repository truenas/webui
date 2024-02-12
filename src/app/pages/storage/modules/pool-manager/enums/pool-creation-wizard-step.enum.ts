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

export const getPoolCreationWizardStepIndex: Record<PoolCreationWizardStep, number> = {
  [PoolCreationWizardStep.General]: 0,
  [PoolCreationWizardStep.EnclosureOptions]: 1,
  [PoolCreationWizardStep.Data]: 2,
  [PoolCreationWizardStep.Log]: 3,
  [PoolCreationWizardStep.Spare]: 4,
  [PoolCreationWizardStep.Cache]: 5,
  [PoolCreationWizardStep.Metadata]: 6,
  [PoolCreationWizardStep.Dedup]: 7,
  [PoolCreationWizardStep.Review]: 8,
};
