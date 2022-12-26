import { CreateVdevLayout } from 'app/enums/v-dev-type.enum';

export interface PoolManagerWizardFormValue {
  general?: {
    name?: string;
    encryption?: boolean;
  };
  data?: {
    type?: CreateVdevLayout;
    size?: string;
    width?: number;
    number?: number;
  };
  log?: unknown;
  spare?: unknown;
  cache?: unknown;
  metadata?: unknown;
  review?: unknown;
}
