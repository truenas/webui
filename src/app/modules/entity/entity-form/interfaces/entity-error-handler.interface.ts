import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { FieldConfig } from 'app/modules/entity/entity-form/models/field-config.interface';

/**
 * This interface is here simply to describe arguments for some EntityUtils functions.
 * Do not use directly.
 */
export interface EntityErrorHandler {
  error?: string;
  conf?: FormConfiguration;
  fieldConfig?: FieldConfig[];
}
