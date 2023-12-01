import { ParamsBuilder } from 'app/helpers/params-builder/params-builder.class';
import { QueryParams } from 'app/interfaces/query-api.interface';

interface User {
  username: string;
  age: number;
  locked: boolean;
}

describe('ParamsBuilder - other', () => {
  it('allows params to be specified via constructor', () => {
    const input = [
      [['username', '=', 'bob']],
      { limit: 5 },
    ] as QueryParams<User>;

    const builder = new ParamsBuilder<User>(input);

    expect(builder.getParams()).toEqual(input);
  });

  it('sets options when setOptions() is called', () => {
    const builder = new ParamsBuilder<User>()
      .setOptions({ limit: 5 });

    expect(builder.getParams()).toEqual([[], { limit: 5 }]);
  });

  describe('mergeWith', () => {
    it('merges options and params with another set of params', () => {
      const builder = new ParamsBuilder<User>()
        .filter('age', '=', 45)
        .setOptions({ limit: 5 })
        .mergeWith([
          [['username', '=', 'bob']],
          { limit: 10 },
        ]);

      expect(builder.getParams()).toEqual([[['age', '=', 45], ['username', '=', 'bob']], { limit: 10 }]);
    });

    it('merges params when first set is empty', () => {
      const builder = new ParamsBuilder<User>()
        .setOptions({ limit: 5 })
        .mergeWith([
          [['username', '=', 'bob']],
          { limit: 10 },
        ]);

      expect(builder.getParams()).toEqual([[['username', '=', 'bob']], { limit: 10 }]);
    });
  });
});
