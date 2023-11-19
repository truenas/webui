import { ParamsBuilder } from 'app/helpers/params-builder/params-builder.class';

interface User {
  username: string;
  age: number;
  locked: boolean;
}

describe('ParamsBuilder – filters groups', () => {
  describe('group()', () => {
    it('replaces current filters with ones from group() when it is called', () => {
      const builder = new ParamsBuilder<User>()
        .group((group) => {
          group
            .filter('username', '=', 'bob')
            .andFilter('username', '=', 'admin');
        });

      expect(builder.getParams()).toEqual([[['username', '=', 'bob'], ['username', '=', 'admin']], {}]);
    });

    it('condition after the group', () => {
      const builder = new ParamsBuilder<User>()
        .group((group) => {
          group
            .filter('username', '=', 'bob')
            .orFilter('username', '=', 'admin');
        })
        .andFilter('age', '>', 18);

      // (username = 'bob' OR username = 'admin') AND age > 18
      expect(builder.getParams()).toEqual([[
        [
          'OR',
          [
            ['username', '=', 'bob'],
            ['username', '=', 'admin'],
          ],
        ],
        ['age', '>', 18],
      ], {}]);
    });
  });

  describe('andGroup()', () => {
    it('after filter()', () => {
      const builder = new ParamsBuilder<User>()
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

    it('after simple OR', () => {
      const builder = new ParamsBuilder<User>()
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
  });

  describe('orGroup()', () => {
    it('after filter()', () => {
      const builder = new ParamsBuilder<User>()
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

    it('after OR', () => {
      const builder = new ParamsBuilder<User>()
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
  });

  describe('mixed groups', () => {
    it('supports nested groups', () => {
      const builder = new ParamsBuilder<User>()
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

    it('two groups via OR - first group is OR', () => {
      const builder = new ParamsBuilder<User>()
        .group((group) => {
          group
            .filter('username', '=', 'bob')
            .orFilter('username', '=', 'admin');
        })
        .orGroup((group) => {
          group
            .filter('age', '<', 45)
            .andFilter('age', '>', 18);
        });

      // (username = 'bob' OR username = 'admin') OR (age < 45 AND age > 18)
      expect(builder.getParams()).toEqual([[
        [
          'OR',
          [
            [
              'OR',
              [
                ['username', '=', 'bob'],
                ['username', '=', 'admin'],
              ],
            ],
            [
              ['age', '<', 45],
              ['age', '>', 18],
            ],
          ],
        ],
      ], {}]);
    });

    it('two groups via OR - first group is AND', () => {
      const builder = new ParamsBuilder<User>()
        .group((group) => {
          group
            .filter('username', '=', 'bob')
            .andFilter('locked', '=', true);
        })
        .orGroup((group) => {
          group
            .filter('age', '<', 45)
            .andFilter('age', '>', 18);
        });

      // (username = 'bob' AND locked = true) OR (age < 45 AND age > 18)
      expect(builder.getParams()).toEqual([[
        [
          'OR',
          [
            [
              ['username', '=', 'bob'],
              ['locked', '=', true],
            ],
            [
              ['age', '<', 45],
              ['age', '>', 18],
            ],
          ],
        ],
      ], {}]);
    });

    it('two groups via AND', () => {
      const builder = new ParamsBuilder<User>()
        .group((group) => {
          group
            .filter('username', '=', 'bob')
            .orFilter('username', '=', 'admin');
        })
        .andGroup((group) => {
          group
            .filter('age', '<', 45)
            .andFilter('age', '>', 18);
        });

      // (username = 'bob' OR username = 'admin') OR (age < 45 AND age > 18)
      expect(builder.getParams()).toEqual([[
        [
          'OR',
          [
            ['username', '=', 'bob'],
            ['username', '=', 'admin'],
          ],
        ],
        ['age', '<', 45],
        ['age', '>', 18],
      ], {}]);
    });
  });
});
