import { ParamsBuilder } from 'app/helpers/params-builder/params-builder.class';

interface User {
  username: string;
  age: number;
  locked: boolean;
}

describe('ParamsBuilder - filters simple', () => {
  describe('filter()', () => {
    it('sets a filter when filter() is called', () => {
      const builder = new ParamsBuilder<User>().filter('username', '=', 'bob');

      expect(builder.getParams()).toEqual([[['username', '=', 'bob']], {}]);
    });

    describe('andFilter()', () => {
      it('after filter()', () => {
        const builder = new ParamsBuilder<User>()
          .andFilter('username', '=', 'bob')
          .andFilter('age', '>', 18);

        expect(builder.getParams()).toEqual([[['username', '=', 'bob'], ['age', '>', 18]], {}]);
      });

      it('after OR', () => {
        const builder = new ParamsBuilder<User>()
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

      it('after OR in succession', () => {
        const builder = new ParamsBuilder<User>()
          .filter('username', '=', 'bob')
          .orFilter('username', '=', 'alice')
          .andFilter('age', '>', 18)
          .andFilter('locked', '=', false);

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
                ['locked', '=', false],
              ],
            ],
          ],
        ], {}]);
      });
    });

    describe('orFilter()', () => {
      it('after filter()', () => {
        const builder = new ParamsBuilder<User>()
          .filter('username', '=', 'bob')
          .orFilter('username', '=', 'alice');

        expect(builder.getParams()).toEqual([[['OR', [['username', '=', 'bob'], ['username', '=', 'alice']]]], {}]);
      });

      it('after OR', () => {
        const builder1 = new ParamsBuilder<User>()
          .filter('username', '=', 'bob')
          .orFilter('username', '=', 'alice')
          .orFilter('username', '=', 'eve');

        // username = 'bob' OR username = 'alice' OR username = 'eve'
        expect(builder1.getParams()).toEqual([[
          [
            'OR',
            [
              ['username', '=', 'bob'],
              ['username', '=', 'alice'],
              ['username', '=', 'eve'],
            ],
          ],
        ], {}]);
      });

      it('after OR, then AND', () => {
        const builder = new ParamsBuilder<User>()
          .filter('username', '=', 'bob')
          .orFilter('username', '=', 'alice')
          .andFilter('age', '>', 18)
          .orFilter('username', '=', 'eve');

        // username = 'bob' OR username = 'alice' AND age > 18 OR username = 'eve'
        // Equivalent to: username = 'bob' OR (username = 'alice' AND age > 18) OR username = 'eve'
        expect(builder.getParams()).toEqual([[
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
  });
});
