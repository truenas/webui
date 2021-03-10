export const ACTION_DISABLE = "DISABLE";
export const ACTION_ENABLE = "ENABLE";
export const ACTION_SHOW = "SHOW";
export const ACTION_HIDE = "HIDE";

export const CONNECTION_AND = "AND";
export const CONNECTION_OR = "OR";

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
  action: string;
  connective?: string;
  when: FieldRelation[];
}
