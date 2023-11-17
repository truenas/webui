import { QueryBuilder } from 'app/interfaces/api/query-builder/query-builder.class';
import { QueryParams } from 'app/interfaces/query-api.interface';

interface User {
  username: string;
  age: number;
  locked: boolean;
}

describe('QueryBuilder', () => {
  it('allows params to be specified via constructor', () => {
    const input = [
      [['username', '=', 'bob']],
      { limit: 5 },
    ] as QueryParams<User>;

    const builder = new QueryBuilder<User>(input);

    expect(builder.getParams()).toEqual(input);
  });

  it('sets options when setOptions() is called', () => {
    const builder = new QueryBuilder<User>()
      .setOptions({ limit: 5 });

    expect(builder.getParams()).toEqual([[], { limit: 5 }]);
  });

  describe('simple filters', () => {
    it('sets a filter when filter() is called', () => {
      const builder = new QueryBuilder<User>().filter('username', '=', 'bob');

      expect(builder.getParams()).toEqual([[['username', '=', 'bob']], {}]);
    });

    it('adds a filter when andFilter() is called', () => {
      const builder = new QueryBuilder<User>()
        .andFilter('username', '=', 'bob')
        .andFilter('age', '>', 18);

      expect(builder.getParams()).toEqual([[['username', '=', 'bob'], ['age', '>', 18]], {}]);
    });

    it('adds a filter to an or filter when andFilter() is called', () => {
      const builder = new QueryBuilder<User>()
        .filter('username', '=', 'bob')
        .orFilter('username', '=', 'alice')
        .andFilter('age', '>', 18);

      // username = 'bob' OR username = 'alice' AND age > 18
      // Equivalent to: username = 'bob' OR (username = 'alice' AND age > 18)
      expect(builder.getParams()).toEqual([[
        [
          'OR',
          [
            ['username', '=', 'bob'],
            [
              ['username', '=', 'alice'],
              ['age', '>', 18],
            ],
          ],
        ],
      ], {}]);
    });

    it('adds an or filter when orFilter() is called', () => {
      const builder = new QueryBuilder<User>()
        .filter('username', '=', 'bob')
        .orFilter('username', '=', 'alice');

      expect(builder.getParams()).toEqual([[['OR', [['username', '=', 'bob'], ['username', '=', 'alice']]]], {}]);
    });

    it('adds an or filter to a group of existing or filters when ofFilter() is called and previous filter is an or filter', () => {
      const builder1 = new QueryBuilder<User>()
        .filter('username', '=', 'bob')
        .orFilter('username', '=', 'alice')
        .orFilter('username', '=', 'eve');

      // username = 'bob' OR username = 'alice' OR username = 'eve'
      expect(builder1.getParams()).toEqual([[['OR', [['username', '=', 'bob'], ['username', '=', 'alice'], ['username', '=', 'eve']]]], {}]);

      const builder2 = new QueryBuilder<User>()
        .filter('username', '=', 'bob')
        .orFilter('username', '=', 'alice')
        .andFilter('age', '>', 18)
        .orFilter('username', '=', 'eve');

      // username = 'bob' OR username = 'alice' AND age > 18 OR username = 'eve'
      // Equivalent to: username = 'bob' OR (username = 'alice' AND age > 18) OR username = 'eve'
      expect(builder2.getParams()).toEqual([[
        [
          'OR',
          [
            ['username', '=', 'bob'],
            [
              ['username', '=', 'alice'],
              ['age', '>', 18],
            ],
            ['username', '=', 'eve'],
          ],
        ],
      ], {}]);
    });
  });

  describe('filter groups', () => {
    it('replaces current filters with ones from group() when it is called', () => {
      const builder = new QueryBuilder<User>()
        .group((group) => {
          group
            .filter('username', '=', 'bob')
            .andFilter('username', '=', 'admin');
        });

      expect(builder.getParams()).toEqual([[['username', '=', 'bob'], ['username', '=', 'admin']], {}]);
    });

    it('adds a new condition group via AND when andGroup() is called and previous connector is AND', () => {
      const builder = new QueryBuilder<User>()
        .filter('age', '>', 45)
        .andGroup((group) => {
          group
            .filter('username', '=', 'adam')
            .orFilter('username', '=', 'eve');
        });

      // age > 45 AND (username = 'admin' OR username = 'eve')
      expect(builder.getParams()).toEqual([[
        ['age', '>', 45],
        [
          'OR',
          [
            ['username', '=', 'adam'],
            ['username', '=', 'eve'],
          ],
        ],
      ], {}]);
    });

    it('adds a new group via AND when andGroup() is called and previous connector is OR', () => {
      const builder = new QueryBuilder<User>()
        .filter('age', '=', 45)
        .orFilter('age', '=', 46)
        .andGroup((group) => {
          group
            .filter('username', '=', 'adam')
            .orFilter('username', '=', 'eve');
        });

      // age = 45 OR age = 46 AND (username = 'admin' OR username = 'eve')
      // Equivalent to: age = 45 OR (age = 46 AND (username = 'admin' OR username = 'eve'))
      expect(builder.getParams()).toEqual([[
        [
          'OR',
          [
            ['age', '=', 45],
            [
              ['age', '=', 46],
              [
                'OR',
                [
                  ['username', '=', 'adam'],
                  ['username', '=', 'eve'],
                ],
              ],
            ],
          ],
        ],
      ], {}]);
    });

    it('adds a new group via OR when orGroup() is called and previous connector is AND', () => {
      const builder = new QueryBuilder<User>()
        .filter('age', '>', 45)
        .orGroup((group) => {
          group
            .filter('username', '=', 'adam')
            .andFilter('age', '>', 30);
        });

      // age > 45 OR (username = 'admin' AND age > 30)
      expect(builder.getParams()).toEqual([[
        [
          'OR',
          [
            ['age', '>', 45],
            [
              ['username', '=', 'adam'],
              ['age', '>', 30],
            ],
          ],
        ],
      ], {}]);
    });

    it('adds a new group via OR when orGroup() is called and previous connector is OR', () => {
      const builder = new QueryBuilder<User>()
        .filter('age', '=', 45)
        .orFilter('age', '=', 46)
        .orGroup((group) => {
          group
            .filter('username', '=', 'adam')
            .andFilter('age', '>', 30);
        });

      // age = 45 OR age = 46 OR (username = 'admin' AND age > 30)
      // Equivalent to: age = 45 OR age = 46 OR (username = 'admin' AND age > 30)
      expect(builder.getParams()).toEqual([[
        [
          'OR',
          [
            ['age', '=', 45],
            ['age', '=', 46],
            [
              ['username', '=', 'adam'],
              ['age', '>', 30],
            ],
          ],
        ],
      ], {}]);
    });

    it('supports nested groups', () => {
      const builder = new QueryBuilder<User>()
        .filter('age', '=', 45)
        .orFilter('age', '=', 46)
        .orGroup((group) => {
          group
            .filter('username', '=', 'adam')
            .andGroup((subgroup) => {
              subgroup
                .filter('age', '=', 30)
                .orFilter('age', '=', 20);
            });
        });

      // age = 45 OR age = 46 OR (username = 'adam' AND (age = 30 OR age = 20))
      expect(builder.getParams()).toEqual([[
        [
          'OR',
          [
            ['age', '=', 45],
            ['age', '=', 46],
            [
              ['username', '=', 'adam'],
              [
                'OR',
                [
                  ['age', '=', 30],
                  ['age', '=', 20],
                ],
              ],
            ],
          ],
        ],
      ], {}]);
    });
  });

  describe('mergeWith', () => {
    it('merges options and params with another set of params', () => {
      const builder = new QueryBuilder<User>()
        .filter('age', '=', 45)
        .setOptions({ limit: 5 })
        .mergeWith([
          [['username', '=', 'bob']],
          { limit: 10 },
        ]);

      expect(builder.getParams()).toEqual([[['age', '=', 45], ['username', '=', 'bob']], { limit: 10 }]);
    });
  });
});
