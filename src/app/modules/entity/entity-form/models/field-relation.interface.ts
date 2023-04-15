import { RelationAction } from 'app/modules/entity/entity-form/models/relation-action.enum';
import { RelationConnection } from 'app/modules/entity/entity-form/models/relation-connection.enum';

export interface FieldRelation {
  name: string;
  status?: string;
  value?: unknown;
  operator?: string;
}

export interface RelationGroup {
  action: RelationAction;
  connective?: RelationConnection;
  when: FieldRelation[];
}
