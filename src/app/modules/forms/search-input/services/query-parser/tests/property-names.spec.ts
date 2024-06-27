import { TranslateService } from '@ngx-translate/core';
import { QueryParserService } from 'app/modules/forms/search-input/services/query-parser/query-parser.service';
import { QuerySyntaxError } from 'app/modules/forms/search-input/services/query-parser/query-parsing-result.interface';

describe('QueryParserService - property names', () => {
  const service = new QueryParserService({
    instant: (key: string) => key,
  } as TranslateService);

  describe('supports unquoted property names', () => {
    it('basic case', () => {
      const unquoted = service.parseQuery('Username = "Bob"');
      expect(unquoted.hasErrors).toBe(false);
      expect(unquoted.tree).toMatchObject({ property: 'Username' });
    });

    it('without whitespaces', () => {
      const withoutWhitespaces = service.parseQuery('Username="Bob"');
      expect(withoutWhitespaces.hasErrors).toBe(false);
      expect(withoutWhitespaces.tree).toMatchObject({ property: 'Username' });
    });

    it('does not support new lines in property names', () => {
      const newLines = service.parseQuery('User\nname = "Bob"');
      expect(newLines.hasErrors).toBe(true);
      expect(newLines.errors).toHaveLength(1);
      expect(newLines.errors[0]).toBeInstanceOf(QuerySyntaxError);
    });
  });

  describe('supports quoted property names', () => {
    it('basic case', () => {
      const double = service.parseQuery('"Username" = "Bob"');
      expect(double.hasErrors).toBe(false);
      expect(double.tree).toMatchObject({ property: 'Username' });

      const single = service.parseQuery("'Username' = 'Bob'");
      expect(single.hasErrors).toBe(false);
      expect(single.tree).toMatchObject({ property: 'Username' });
    });

    it('no whitespaces', () => {
      const double = service.parseQuery('"Username"="Bob"');
      expect(double.hasErrors).toBe(false);
      expect(double.tree).toMatchObject({ property: 'Username' });

      const single = service.parseQuery("'Username'='Bob'");
      expect(single.hasErrors).toBe(false);
      expect(single.tree).toMatchObject({ property: 'Username' });
    });

    it('with spaces inside', () => {
      const double = service.parseQuery('"User name" = "Bob"');
      expect(double.hasErrors).toBe(false);
      expect(double.tree).toMatchObject({ property: 'User name' });

      const single = service.parseQuery("'User name' = 'Bob'");
      expect(single.hasErrors).toBe(false);
      expect(single.tree).toMatchObject({ property: 'User name' });
    });

    it('with escapes', () => {
      const double = service.parseQuery('"User \\"name\\"" = "Bob"');
      expect(double.hasErrors).toBe(false);
      expect(double.tree).toMatchObject({ property: 'User "name"' });

      const single = service.parseQuery("'User \\'name\\'' = 'Bob'");
      expect(single.hasErrors).toBe(false);
      expect(single.tree).toMatchObject({ property: "User 'name'" });
    });

    it('with quote of a different type', () => {
      const double = service.parseQuery('"User \'name\'" = "Bob"');
      expect(double.hasErrors).toBe(false);
      expect(double.tree).toMatchObject({ property: "User 'name'" });

      const single = service.parseQuery("'User \"name\"' = 'Bob'");
      expect(single.hasErrors).toBe(false);
      expect(single.tree).toMatchObject({ property: 'User "name"' });
    });

    it('with double slashes', () => {
      const double = service.parseQuery('"User \\\\name" = "Bob"');
      expect(double.hasErrors).toBe(false);
      expect(double.tree).toMatchObject({ property: 'User \\name' });

      const single = service.parseQuery("'User\\\\name\\'' = 'Bob'");
      expect(single.hasErrors).toBe(false);
      expect(single.tree).toMatchObject({ property: "User\\name'" });
    });

    it('with single quote gives error', () => {
      const singleQuoted = service.parseQuery('Username = "Bob');
      expect(singleQuoted.hasErrors).toBe(true);
      expect(singleQuoted.errors).toHaveLength(1);
      expect(singleQuoted.errors[0]).toBeInstanceOf(QuerySyntaxError);
    });

    it('with non-ASCII characters if they are quoted', () => {
      const withEscapes = service.parseQuery('"Ім\'я" = "Bob"');
      expect(withEscapes.hasErrors).toBe(false);
      expect(withEscapes.tree).toMatchObject({ property: 'Ім\'я' });

      const withEscapesAndSpaces = service.parseQuery('"Моє ім\'я" = "Bob"');
      expect(withEscapesAndSpaces.hasErrors).toBe(false);
      expect(withEscapesAndSpaces.tree).toMatchObject({ property: 'Моє ім\'я' });

      const chinese = service.parseQuery('"姓名" = "Bob"');
      expect(chinese.hasErrors).toBe(false);
      expect(chinese.tree).toMatchObject({ property: '姓名' });
    });

    it('with non-ASCII characters if they are not quoted', () => {
      const noQuotes = service.parseQuery('Имя = "Bob"');
      expect(noQuotes.hasErrors).toBe(false);
      expect(noQuotes.tree).toMatchObject({ property: 'Имя' });

      const noQuotesAndSpace = service.parseQuery('Я є = "Bob"');
      expect(noQuotesAndSpace.hasErrors).toBe(true);
      expect(noQuotesAndSpace.errors).toHaveLength(1);
      expect(noQuotesAndSpace.errors[0]).toBeInstanceOf(QuerySyntaxError);

      const noQuotesMultiLanguage = service.parseQuery('姓名úüæПрЇєß = "Bob"');
      expect(noQuotesMultiLanguage.hasErrors).toBe(false);
      expect(noQuotesMultiLanguage.tree).toMatchObject({ property: '姓名úüæПрЇєß' });

      const noQuotesChineseAndSpace = service.parseQuery('姓名 姓名 = "Bob"');
      expect(noQuotesChineseAndSpace.hasErrors).toBe(true);
      expect(noQuotesChineseAndSpace.errors).toHaveLength(1);
      expect(noQuotesChineseAndSpace.errors[0]).toBeInstanceOf(QuerySyntaxError);
    });
  });
});
