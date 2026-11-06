import { QueryComparator } from 'app/interfaces/query-api.interface';

/**
 * Parsed query tree. `(Username = "Bob" AND Age > 19) OR (Username = "Peter")` becomes a ConditionGroup
 * joined by OR, holding a nested ConditionGroup (`Username = "Bob"` AND `Age > 19`) and the Condition
 * `Username = "Peter"`.
 */
export interface QueryParsingResult {
  hasErrors: boolean;
  errors: QueryParsingError[];
  tree: ConditionGroup | Condition | null;
}

export interface QueryParsingError {
  from: number;
  to: number;
  message: string;
}

export class QuerySyntaxError extends Error {
  constructor(
    readonly from: number,
    readonly to: number,
  ) {
    super(`Syntax error at ${from}-${to}`);
  }
}

export interface ConditionGroup {
  left: ConditionGroup | Condition;
  connector: ConnectorType;
  right: ConditionGroup | Condition;
}

export interface Condition {
  property: string;
  comparator: QueryComparator;
  value: LiteralValue | LiteralValue[];
}

export type LiteralValue = string | number | boolean | null;

export enum ConnectorType {
  And = 'AND',
  Or = 'OR',
}

export function isConditionGroup(node: ConditionGroup | Condition | null): node is ConditionGroup {
  return (node as ConditionGroup)?.connector !== undefined;
}

export enum ParsedToken {
  Condition = 'Condition',
  ConditionGroup = 'ConditionGroup',
  Property = 'Property',
  Comparator = 'Comparator',
  And = 'And',
  Or = 'Or',
  Value = 'Value',
  SingleQuotedString = 'SingleQuotedString',
  DoubleQuotedString = 'DoubleQuotedString',
  UnquotedString = 'UnquotedString',
  Boolean = 'Boolean',
  Number = 'Number',
  Null = 'Null',
  List = 'List',
  Error = '⚠',
}
