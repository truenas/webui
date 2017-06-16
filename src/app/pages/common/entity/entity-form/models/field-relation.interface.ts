export const ACTION_DISABLE = "DISABLE";
export const ACTION_ENABLE = "ENABLE";

export const CONNECTION_AND = "AND";
export const CONNECTION_OR = "OR";

export interface FieldRelation {
    name: string;
    status?: string;
    value?: any;
}

export interface RelationGroup {
    action: string;
    connective?: string;
    when: FieldRelation[];
}
