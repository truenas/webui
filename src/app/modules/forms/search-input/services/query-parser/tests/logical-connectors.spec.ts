import { TranslateService } from '@ngx-translate/core';
import { QueryParserService } from 'app/modules/forms/search-input/services/query-parser/query-parser.service';
import { ConnectorType } from 'app/modules/forms/search-input/services/query-parser/query-parsing-result.interface';

describe('QueryParserService - logical connectors', () => {
  const service = new QueryParserService({
    instant: (key: string) => key,
  } as TranslateService);

  it('supports logical AND', () => {
    const and = service.parseQuery('Age > 18 AND Age < 21');
    expect(and.hasErrors).toBe(false);
    expect(and.tree).toEqual({
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
    });
  });

  it('supports logical OR', () => {
    const or = service.parseQuery('Age = 18 OR Age = 21');
    expect(or.hasErrors).toBe(false);
    expect(or.tree).toEqual({
      left: {
        property: 'Age',
        comparator: '=',
        value: 18,
      },
      connector: ConnectorType.Or,
      right: {
        property: 'Age',
        comparator: '=',
        value: 21,
      },
    });
  });

  it('creates multiple groups when there are multiple conditions', () => {
    const parsed = service.parseQuery('Age > 18 AND Name = "Bob" AND City = "London"');
    expect(parsed.hasErrors).toBe(false);
    expect(parsed.tree).toEqual({
      left: {
        left: {
          property: 'Age',
          comparator: '>',
          value: 18,
        },
        connector: ConnectorType.And,
        right: {
          property: 'Name',
          comparator: '=',
          value: 'Bob',
        },
      },
      connector: ConnectorType.And,
      right: {
        property: 'City',
        comparator: '=',
        value: 'London',
      },
    });
  });

  it('supports multiple groups with mixed connectors (AND takes precedence)', () => {
    const parsed = service.parseQuery('Age > 18 OR Name = "Bob" AND City = "London"');
    expect(parsed.hasErrors).toBe(false);
    expect(parsed.tree).toEqual({
      left: {
        property: 'Age',
        comparator: '>',
        value: 18,
      },
      connector: ConnectorType.Or,
      right: {
        left: {
          property: 'Name',
          comparator: '=',
          value: 'Bob',
        },
        connector: ConnectorType.And,
        right: {
          property: 'City',
          comparator: '=',
          value: 'London',
        },
      },
    });
  });

  it('supports whitespaces and new lines in groups', () => {
    const parsed = service.parseQuery('Age > 18\n\n\n\n AND\n\n\n\nName = "Bob"');
    expect(parsed.hasErrors).toBe(false);
    expect(parsed.tree).toEqual({
      left: {
        property: 'Age',
        comparator: '>',
        value: 18,
      },
      connector: ConnectorType.And,
      right: {
        property: 'Name',
        comparator: '=',
        value: 'Bob',
      },
    });
  });
});
