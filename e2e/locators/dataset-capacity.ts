/**
 * The Space Management card on the Datasets page, and the capacity settings form its Edit opens.
 *
 * The card belongs to whatever the tree has selected, and each readout is `tnTestIdType="text"`
 * with a static base, so there is one per page. The form's controls carry no `testId`, so their
 * ids fall back to the bound control name.
 */
export const datasetCapacityLocators = {
  card: {
    /**
     * The card's Edit, `testId: 'edit-quotas'` on its secondary action. Not offered on a zvol or
     * without `DATASET_WRITE`.
     */
    edit: '[data-test="button-edit-quotas"]',
    /**
     * "Applied Dataset Quota". The quota for the dataset and its children when one is set, as
     * `<size> (applies to descendants)`, otherwise the quota for this dataset alone. Rendered only
     * while either is set.
     */
    appliedQuota: '[data-test="text-space-management-applied-dataset-quota"]',
    /** "Reserved for Dataset". Rendered only while `refreservation` is set. */
    reservedForDataset: '[data-test="text-space-management-reserved-for-dataset"]',
    /** "Reserved for Dataset & Children". Rendered only while `reservation` is set. */
    reservedForDatasetAndChildren: '[data-test="text-space-management-reserved-for-dataset-and-children"]',
  },

  form: {
    /** "Quota for this dataset", a size input that reads `2 GiB` and the like. */
    refquota: '[data-test="input-refquota"]',
    /** The field around {@link refquota}, `testId="refquota"`, which holds its error text. */
    refquotaField: '[data-test="form-field-refquota"]',
    /** This Dataset's "Quota warning alert at, %". Disabled while its Inherit box is ticked. */
    refquotaWarning: '[data-test="input-refquota-warning"]',
    /** The Inherit box beside {@link refquotaWarning}. Labelled Default on a pool's root. */
    refquotaWarningInherit: '[data-test="checkbox-refquota-warning-inherit"]',
    /** "Reserved space for this dataset". */
    refreservation: '[data-test="input-refreservation"]',
    /** "Quota for this dataset and all children". */
    quota: '[data-test="input-quota"]',
    /** "Reserved space for this dataset and all children". */
    reservation: '[data-test="input-reservation"]',
    /** The side panel's Save, disabled while the form is invalid. */
    save: '[data-test="button-save"]',
  },
} as const;
