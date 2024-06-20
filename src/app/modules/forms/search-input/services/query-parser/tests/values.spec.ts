import { TranslateService } from '@ngx-translate/core';
import { QueryParserService } from 'app/modules/forms/search-input/services/query-parser/query-parser.service';
import { QuerySyntaxError } from 'app/modules/forms/search-input/services/query-parser/query-parsing-result.interface';

describe('QueryParserService - values', () => {
  const service = new QueryParserService({
    instant: (key: string) => key,
  } as TranslateService);

  it('supports integers', () => {
    const integer = service.parseQuery('Age = 19');
    expect(integer.hasErrors).toBe(false);
    expect(integer.tree).toMatchObject({ value: 19 });
  });

  // TODO: Add support for floats?

  it('supports null', () => {
    const nullValue = service.parseQuery('Age = null');
    expect(nullValue.hasErrors).toBe(false);
    expect(nullValue.tree).toMatchObject({ value: null });

    // TODO: Check if makes sense API-wise.
    const uppercaseNull = service.parseQuery('Age = NULL');
    expect(uppercaseNull.hasErrors).toBe(false);
    expect(uppercaseNull.tree).toMatchObject({ value: null });
  });

  it('supports booleans', () => {
    const trueValue = service.parseQuery('isAdmin = true');
    expect(trueValue.hasErrors).toBe(false);
    expect(trueValue.tree).toMatchObject({ value: true });

    const uppercaseTrue = service.parseQuery('isAdmin = TRUE');
    expect(uppercaseTrue.hasErrors).toBe(false);
    expect(uppercaseTrue.tree).toMatchObject({ value: true });

    const falseValue = service.parseQuery('isAdmin = false');
    expect(falseValue.hasErrors).toBe(false);
    expect(falseValue.tree).toMatchObject({ value: false });

    const uppercaseFalse = service.parseQuery('isAdmin = FALSE');
    expect(uppercaseFalse.hasErrors).toBe(false);
    expect(uppercaseFalse.tree).toMatchObject({ value: false });
  });

  it('does not support unquoted strings', () => {
    const unquoted = service.parseQuery('Username = Bob');
    expect(unquoted.hasErrors).toBe(true);
    expect(unquoted.errors).toHaveLength(1);
    expect(unquoted.errors[0]).toBeInstanceOf(QuerySyntaxError);
  });

  // TODO: Does not limit what operators can be used with strings. E.g. Username > "Bob" is supported.
  describe('supports quoted strings', () => {
    it('basic case', () => {
      const double = service.parseQuery('Username = "Bob"');
      expect(double.hasErrors).toBe(false);
      expect(double.tree).toMatchObject({ value: 'Bob' });

      const single = service.parseQuery("Username = 'Bob'");
      expect(single.hasErrors).toBe(false);
      expect(single.tree).toMatchObject({ value: 'Bob' });
    });

    it('no whitespaces', () => {
      const double = service.parseQuery('Username="Bob"');
      expect(double.hasErrors).toBe(false);
      expect(double.tree).toMatchObject({ value: 'Bob' });

      const single = service.parseQuery("Username='Bob'");
      expect(single.hasErrors).toBe(false);
      expect(single.tree).toMatchObject({ value: 'Bob' });
    });

    it('with spaces inside', () => {
      const double = service.parseQuery('Username = " Bo b "');
      expect(double.hasErrors).toBe(false);
      expect(double.tree).toMatchObject({ value: ' Bo b ' });

      const single = service.parseQuery("Username = ' Bo b '");
      expect(single.hasErrors).toBe(false);
      expect(single.tree).toMatchObject({ value: ' Bo b ' });
    });

    it('with escapes', () => {
      const double = service.parseQuery('Username = "Bob \\"Jones\\""');
      expect(double.hasErrors).toBe(false);
      expect(double.tree).toMatchObject({ value: 'Bob "Jones"' });

      const single = service.parseQuery("Username = 'Bob \\'Jones\\''");
      expect(single.hasErrors).toBe(false);
      expect(single.tree).toMatchObject({ value: "Bob 'Jones'" });
    });

    it('with quotes', () => {
      const double = service.parseQuery('Username = "Bo\'b"');
      expect(double.hasErrors).toBe(false);
      expect(double.tree).toMatchObject({ value: "Bo'b" });

      const single = service.parseQuery("Username = 'Bo\"b'");
      expect(single.hasErrors).toBe(false);
      expect(single.tree).toMatchObject({ value: 'Bo"b' });
    });

    it('with double slashes', () => {
      const double = service.parseQuery('Username = "Bob\\\\Jones"');
      expect(double.hasErrors).toBe(false);
      expect(double.tree).toMatchObject({ value: 'Bob\\Jones' });

      const single = service.parseQuery("Username = 'Bob\\\\Jones'");
      expect(single.hasErrors).toBe(false);
      expect(single.tree).toMatchObject({ value: 'Bob\\Jones' });
    });

    it('with non-ASCII characters', () => {
      const double = service.parseQuery('Username = "Іво Бобул"');
      expect(double.hasErrors).toBe(false);
      expect(double.tree).toMatchObject({ value: 'Іво Бобул' });

      const single = service.parseQuery("Username = 'Іво Бобул'");
      expect(single.hasErrors).toBe(false);
      expect(single.tree).toMatchObject({ value: 'Іво Бобул' });
    });

    it('empty strings', () => {
      const double = service.parseQuery('Username = ""');
      expect(double.hasErrors).toBe(false);
      expect(double.tree).toMatchObject({ value: '' });

      const single = service.parseQuery("Username = ''");
      expect(single.hasErrors).toBe(false);
      expect(single.tree).toMatchObject({ value: '' });
    });

    it('does not support new lines in strings', () => {
      const double = service.parseQuery('Username = "B\n"ob');
      expect(double.hasErrors).toBe(true);
      expect(double.errors).toHaveLength(2);
      expect(double.errors[0]).toBeInstanceOf(QuerySyntaxError);

      const single = service.parseQuery("Username = 'B\n'ob");
      expect(single.hasErrors).toBe(true);
      expect(single.errors).toHaveLength(2);
      expect(single.errors[0]).toBeInstanceOf(QuerySyntaxError);
    });
  });

  describe('supports arrays', () => {
    it('does not support empty arrays', () => {
      const empty = service.parseQuery('Age in ()');
      expect(empty.hasErrors).toBe(true);
      expect(empty.errors).toHaveLength(1);
      expect(empty.errors[0]).toBeInstanceOf(QuerySyntaxError);
    });

    it('supports arrays of mixed elements', () => {
      const mixed = service.parseQuery('Value IN (19, "Bob", \'Jones\', true, null)');
      expect(mixed.hasErrors).toBe(false);
      expect(mixed.tree).toMatchObject({ value: [19, 'Bob', 'Jones', true, null] });
    });

    it('supports new lines in arrays', () => {
      const withNewLines = service.parseQuery('Value IN ("Bob", \n\n\n\t "Jones")');
      expect(withNewLines.hasErrors).toBe(false);
      expect(withNewLines.tree).toMatchObject({ value: ['Bob', 'Jones'] });
    });
  });
});
