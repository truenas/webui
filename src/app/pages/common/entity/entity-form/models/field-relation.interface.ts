import { RelationAction } from 'app/pages/common/entity/entity-form/models/relation-action.enum';
import { RelationConnection } from 'app/pages/common/entity/entity-form/models/relation-connection.enum';

export interface Relation {
  fieldName: string;
  operatorName: string;
  operatorValue: any;
}

export interface FieldRelation {
  name: string;
  status?: string;
  value?: any;
  operator?: string;
}

export interface RelationGroup {
  action: RelationAction;
  connective?: RelationConnection;
  when: FieldRelation[];
}
