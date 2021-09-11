import { ApiMethod } from 'app/interfaces/api-directory.interface';
import { EntityCardComponent } from 'app/pages/common/entity/entity-card/entity-card.component';

export interface EntityCardConfig {
  preInit?: (cardComponent: EntityCardComponent) => void;
  afterInit?: (cardComponent: EntityCardComponent) => void;
  isFlipped?: boolean;
  toggleProp?: string;
  toggleStart?: ApiMethod;
  toggleStop?: ApiMethod;
  runnningState?: string;
  rowValue?: (row: any, attr: string) => any;
  route_add?: string[];
  cardActions?: EntityCardAction[];
  isActionVisible?: (id: string, row: any) => boolean;
}

export interface EntityCardAction {
  id: string;
  label: string;
  onClick?: (row: any) => void;
  visible?: boolean;
}
