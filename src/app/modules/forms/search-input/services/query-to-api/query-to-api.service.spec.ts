import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { AuditService } from 'app/enums/audit.enum';
import { Option } from 'app/interfaces/option.interface';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';
import {
  ConnectorType,
  QueryParsingResult,
} from 'app/modules/forms/search-input/services/query-parser/query-parsing-result.interface';
import { QueryToApiService } from 'app/modules/forms/search-input/services/query-to-api/query-to-api.service';
import { dateProperty, memoryProperty, textProperty } from 'app/modules/forms/search-input/utils/search-properties.utils';

interface User {
  username: string;
  age: number;
  city: string;
  message_timestamp: string;
  memory_size: string;
  service: AuditService;
}

describe('QueryToApiService', () => {
  const service = new QueryToApiService<User>({
    instant: (key: string) => key,
  } as TranslateService);

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

  it('parses memory type and date type', () => {
    const condition = service.buildFilters({
      tree: {
        left: {
          comparator: '>',
          value: '2023-11-15',
          property: 'Timestamp',
        },
        connector: 'AND',
        right: {
          comparator: '<',
          value: '55 mb',
          property: 'Memory size',
        },
      },
    } as QueryParsingResult, [
      dateProperty(
        'message_timestamp',
        'Timestamp',
      ),
      memoryProperty(
        'memory_size',
        'Memory size',
        { memorySizeParsing() { return 57671680; } } as unknown as IxFormatterService,
      ),
    ]);

    expect(condition).toEqual([
      ['message_timestamp', '>', 1699999200], ['memory_size', '<', 57671680],
    ]);
  });

  it('parses text type with enum', () => {
    const condition = service.buildFilters({
      tree: {
        comparator: 'in',
        value: [
          'Проміжне програмне забезпечення',
          'Ес-ем-бе',
        ],
        property: 'Сервіс',
      },
    } as QueryParsingResult, [
      textProperty(
        'service',
        'Сервіс',
        of<Option[]>([]),
        new Map<AuditService, string>([
          [AuditService.Middleware, 'Проміжне програмне забезпечення'],
          [AuditService.Smb, 'Ес-ем-бе'],
        ]),
      ),
    ]);

    expect(condition).toEqual([['service', 'in', ['MIDDLEWARE', 'SMB']]]);
  });
});
