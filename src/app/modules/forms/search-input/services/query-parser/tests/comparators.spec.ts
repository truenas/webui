import { TranslateService } from '@ngx-translate/core';
import { QueryParserService } from 'app/modules/forms/search-input/services/query-parser/query-parser.service';

describe('QueryParserService - comparators', () => {
  const service = new QueryParserService({
    instant: (key: string) => key,
  } as TranslateService);

  it('supports =', () => {
    const equals = service.parseQuery('Age = 19');
    expect(equals.hasErrors).toBe(false);
    expect(equals.tree).toMatchObject({ comparator: '=' });
  });

  it('supports !=', () => {
    const notEquals = service.parseQuery('Age != 19');
    expect(notEquals.hasErrors).toBe(false);
    expect(notEquals.tree).toMatchObject({ comparator: '!=' });
  });

  it('supports >', () => {
    const greaterThan = service.parseQuery('Age > 19');
    expect(greaterThan.hasErrors).toBe(false);
    expect(greaterThan.tree).toMatchObject({ comparator: '>' });
  });

  it('supports >=', () => {
    const greaterThanOrEqual = service.parseQuery('Age >= 19');
    expect(greaterThanOrEqual.hasErrors).toBe(false);
    expect(greaterThanOrEqual.tree).toMatchObject({ comparator: '>=' });
  });

  it('supports <', () => {
    const lessThan = service.parseQuery('Age < 19');
    expect(lessThan.hasErrors).toBe(false);
    expect(lessThan.tree).toMatchObject({ comparator: '<' });
  });

  it('supports <=', () => {
    const lessThanOrEqual = service.parseQuery('Age <= 19');
    expect(lessThanOrEqual.hasErrors).toBe(false);
    expect(lessThanOrEqual.tree).toMatchObject({ comparator: '<=' });
  });

  it('supports ~', () => {
    const regexMatch = service.parseQuery('Name ~ "^John"');
    expect(regexMatch.hasErrors).toBe(false);
    expect(regexMatch.tree).toMatchObject({ comparator: '~' });
  });

  it('supports in', () => {
    const inList = service.parseQuery('Age in (18, 19, 20)');
    expect(inList.hasErrors).toBe(false);
    expect(inList.tree).toMatchObject({ comparator: 'in' });

    const uppercaseIn = service.parseQuery('Age IN (18, 19, 20)');
    expect(uppercaseIn.hasErrors).toBe(false);
    expect(uppercaseIn.tree).toMatchObject({ comparator: 'in' });
  });

  it('supports nin', () => {
    const notInList = service.parseQuery('Age nin (18, 19, 20)');
    expect(notInList.hasErrors).toBe(false);
    expect(notInList.tree).toMatchObject({ comparator: 'nin' });

    const uppercaseNin = service.parseQuery('Age NIN (18, 19, 20)');
    expect(uppercaseNin.hasErrors).toBe(false);
    expect(uppercaseNin.tree).toMatchObject({ comparator: 'nin' });
  });

  it('supports ^', () => {
    const startsWith = service.parseQuery('Name ^ "John"');
    expect(startsWith.hasErrors).toBe(false);
    expect(startsWith.tree).toMatchObject({ comparator: '^' });
  });

  it('supports !^', () => {
    const notStartsWith = service.parseQuery('Name !^ "John"');
    expect(notStartsWith.hasErrors).toBe(false);
    expect(notStartsWith.tree).toMatchObject({ comparator: '!^' });
  });

  it('supports $', () => {
    const endsWith = service.parseQuery('Name $ "Doe"');
    expect(endsWith.hasErrors).toBe(false);
    expect(endsWith.tree).toMatchObject({ comparator: '$' });
  });

  it('supports !$', () => {
    const doesNotEndWith = service.parseQuery('Name !$ "Doe"');
    expect(doesNotEndWith.hasErrors).toBe(false);
    expect(doesNotEndWith.tree).toMatchObject({ comparator: '!$' });
  });
});
