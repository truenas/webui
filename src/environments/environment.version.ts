/* eslint-disable no-restricted-imports */
import { environmentTemplate } from '../../scripts/ui/environment.template';

// Set this value in the environment.template file,
// otherwise the environment file gets a variable name instead of a real value
export const environmentVersion: string = environmentTemplate.environmentVersion;
