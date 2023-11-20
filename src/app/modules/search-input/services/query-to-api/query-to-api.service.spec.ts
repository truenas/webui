import {
  ConnectorType,
  QueryParsingResult,
} from 'app/modules/search-input/services/query-parser/query-parsing-result.interface';
import { QueryToApiService } from 'app/modules/search-input/services/query-to-api/query-to-api.service';

interface User {
  username: string;
  age: number;
  city: string;
}

describe('QueryToApiService', () => {
  const service = new QueryToApiService<User>();

  it('converts an array of parsed conditions to an API query - condition in root', () => {
    const condition = service.buildFilters({
      tree: {
        property: 'Age',
        comparator: '>',
        value: 18,
      },
    } as QueryParsingResult, []);

    expect(condition).toEqual([['Age', '>', 18]]);
  });

  it('converts an array of parsed conditions to an API query - condition groups AND', () => {
    const condition = service.buildFilters({
      tree: {
        left: {
          left: {
            property: 'age',
            comparator: '>',
            value: 18,
          },
          connector: ConnectorType.And,
          right: {
            property: 'username',
            comparator: '=',
            value: 'Bob',
          },
        },
        connector: ConnectorType.And,
        right: {
          property: 'city',
          comparator: '=',
          value: 'London',
        },
      },
    } as QueryParsingResult, []);

    expect(condition).toEqual([
      ['age', '>', 18],
      ['username', '=', 'Bob'],
      ['city', '=', 'London'],
    ]);
  });

  it('converts an array of parsed conditions to an API query - condition groups OR', () => {
    const condition = service.buildFilters({
      tree: {
        left: {
          left: {
            property: 'age',
            comparator: '>',
            value: 18,
          },
          connector: ConnectorType.Or,
          right: {
            property: 'username',
            comparator: '=',
            value: 'Bob',
          },
        },
        connector: ConnectorType.And,
        right: {
          property: 'city',
          comparator: '=',
          value: 'London',
        },
      },
    } as QueryParsingResult, []);

    expect(condition).toEqual([
      [
        'OR',
        [
          ['age', '>', 18],
          ['username', '=', 'Bob'],
        ],
      ],
      ['city', '=', 'London'],
    ]);
  });

  it('converts an array of nested parsed conditions to an API query', () => {
    // (age = 18 OR (age > 20 AND age < 30)) AND (username = 'Bob' OR username = 'Alice') AND city = 'London'
    const condition = service.buildFilters({
      tree: {
        left: {
          left: {
            left: {
              property: 'age',
              comparator: '=',
              value: 18,
            },
            connector: ConnectorType.Or,
            right: {
              left: {
                property: 'age',
                comparator: '>',
                value: 20,
              },
              connector: ConnectorType.And,
              right: {
                property: 'age',
                comparator: '<',
                value: 30,
              },
            },
          },
          connector: ConnectorType.And,
          right: {
            left: {
              property: 'username',
              comparator: '=',
              value: 'Bob',
            },
            connector: ConnectorType.Or,
            right: {
              property: 'username',
              comparator: '=',
              value: 'Alice',
            },
          },
        },
        connector: ConnectorType.And,
        right: {
          property: 'city',
          comparator: '=',
          value: 'London',
        },
      },
    } as QueryParsingResult, []);

    expect(condition).toEqual([
      [
        'OR',
        [
          ['age', '=', 18],
          [
            ['age', '>', 20],
            ['age', '<', 30],
          ],
        ],
      ],
      [
        'OR',
        [
          ['username', '=', 'Bob'],
          ['username', '=', 'Alice'],
        ],
      ],
      ['city', '=', 'London'],
    ]);
  });
});
