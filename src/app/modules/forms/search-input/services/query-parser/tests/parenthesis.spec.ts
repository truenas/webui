import { TranslateService } from '@ngx-translate/core';
import { QueryParserService } from 'app/modules/forms/search-input/services/query-parser/query-parser.service';
import { ConnectorType } from 'app/modules/forms/search-input/services/query-parser/query-parsing-result.interface';

describe('QueryParserService - logical connectors', () => {
  const service = new QueryParserService({
    instant: (key: string) => key,
  } as TranslateService);

  it('supports parenthesis around a single condition', () => {
    const parsed = service.parseQuery('(Age = 18)');
    expect(parsed.hasErrors).toBe(false);
    expect(parsed.tree).toEqual({
      property: 'Age',
      comparator: '=',
      value: 18,
    });
  });

  it('supports parenthesis on same type of connectors', () => {
    const parsed = service.parseQuery('Name = "Bob" AND (Age > 18 AND Age < 21)');
    expect(parsed.hasErrors).toBe(false);
    expect(parsed.tree).toEqual({
      left: {
        property: 'Name',
        comparator: '=',
        value: 'Bob',
      },
      connector: ConnectorType.And,
      right: {
        left: {
          property: 'Age',
          comparator: '>',
          value: 18,
        },
        connector: ConnectorType.And,
        right: {
          property: 'Age',
          comparator: '<',
          value: 21,
        },
      },
    });
  });

  it('supports parenthesis on mixed connectors taking into precedence into account', () => {
    const parsed = service.parseQuery('(Name = "Bob" OR Name = "Sally") AND Age < 21');
    expect(parsed.hasErrors).toBe(false);
    expect(parsed.tree).toEqual({
      left: {
        left: {
          property: 'Name',
          comparator: '=',
          value: 'Bob',
        },
        connector: ConnectorType.Or,
        right: {
          property: 'Name',
          comparator: '=',
          value: 'Sally',
        },
      },
      connector: ConnectorType.And,
      right: {
        property: 'Age',
        comparator: '<',
        value: 21,
      },
    });
  });

  it('supports nested parenthesis', () => {
    const parsed = service.parseQuery('((Name = "Bob" AND Age > 18) OR Age < 21)');
    expect(parsed.hasErrors).toBe(false);
    expect(parsed.tree).toEqual({
      left: {
        left: {
          property: 'Name',
          comparator: '=',
          value: 'Bob',
        },
        connector: ConnectorType.And,
        right: {
          property: 'Age',
          comparator: '>',
          value: 18,
        },
      },
      connector: ConnectorType.Or,
      right: {
        property: 'Age',
        comparator: '<',
        value: 21,
      },
    });
  });

  it('supports multiple redundant parenthesis', () => {
    const parsed = service.parseQuery('((((Name = "Bob"))) AND ((Age > 19)))');
    expect(parsed.hasErrors).toBe(false);
    expect(parsed.tree).toEqual({
      left: {
        property: 'Name',
        comparator: '=',
        value: 'Bob',
      },
      connector: ConnectorType.And,
      right: {
        property: 'Age',
        comparator: '>',
        value: 19,
      },
    });
  });

  it('supports new lines and whitespaces between parenthesis', () => {
    const parsed = service.parseQuery('Name = "Bob" AND \n\n(Age > 18 \n\n\n\t AND Age < 21)');
    expect(parsed.hasErrors).toBe(false);
    expect(parsed.tree).toEqual({
      left: {
        property: 'Name',
        comparator: '=',
        value: 'Bob',
      },
      connector: ConnectorType.And,
      right: {
        left: {
          property: 'Age',
          comparator: '>',
          value: 18,
        },
        connector: ConnectorType.And,
        right: {
          property: 'Age',
          comparator: '<',
          value: 21,
        },
      },
    });
  });
});
