import {
  isValidDelay,
  parseDelay,
  isJsonString,
  safeJsonParse,
  safeJsonStringify,
} from './type-guards';

describe('type-guards', () => {
  describe('isValidDelay', () => {
    it('should return true for valid positive numbers', () => {
      expect(isValidDelay(0)).toBe(true);
      expect(isValidDelay(100)).toBe(true);
      expect(isValidDelay(5000)).toBe(true);
    });

    it('should return false for negative numbers', () => {
      expect(isValidDelay(-1)).toBe(false);
      expect(isValidDelay(-100)).toBe(false);
    });

    it('should return false for NaN', () => {
      expect(isValidDelay(NaN)).toBe(false);
    });

    it('should return true for valid numeric strings', () => {
      expect(isValidDelay('0')).toBe(true);
      expect(isValidDelay('100')).toBe(true);
      expect(isValidDelay('5000')).toBe(true);
    });

    it('should return false for invalid strings', () => {
      expect(isValidDelay('abc')).toBe(false);
      expect(isValidDelay('12.34')).toBe(true); // parseInt handles this
      expect(isValidDelay('')).toBe(false);
    });

    it('should return false for non-numeric types', () => {
      expect(isValidDelay(null)).toBe(false);
      expect(isValidDelay(undefined)).toBe(false);
      expect(isValidDelay({})).toBe(false);
      expect(isValidDelay([])).toBe(false);
      expect(isValidDelay(true)).toBe(false);
    });
  });

  describe('parseDelay', () => {
    it('should parse valid numbers', () => {
      expect(parseDelay(100)).toBe(100);
      expect(parseDelay(0)).toBe(0);
      expect(parseDelay(5000)).toBe(5000);
    });

    it('should return 0 for negative numbers', () => {
      expect(parseDelay(-100)).toBe(0);
      expect(parseDelay(-1)).toBe(0);
    });

    it('should parse valid numeric strings', () => {
      expect(parseDelay('100')).toBe(100);
      expect(parseDelay('0')).toBe(0);
      expect(parseDelay('5000')).toBe(5000);
    });

    it('should return default value for invalid inputs', () => {
      expect(parseDelay(null)).toBe(2000);
      expect(parseDelay(undefined)).toBe(2000);
      expect(parseDelay('abc')).toBe(2000);
      expect(parseDelay(NaN)).toBe(2000);
      expect(parseDelay({})).toBe(2000);
    });

    it('should use custom default value', () => {
      expect(parseDelay(null, 3000)).toBe(3000);
      expect(parseDelay('invalid', 1000)).toBe(1000);
    });

    it('should handle edge cases', () => {
      expect(parseDelay('12.99')).toBe(12); // parseInt truncates
      expect(parseDelay('100abc')).toBe(100); // parseInt parses until non-numeric
      expect(parseDelay('   50   ')).toBe(50); // parseInt trims whitespace
    });
  });

  describe('isJsonString', () => {
    it('should return true for valid JSON strings', () => {
      expect(isJsonString('{"foo": "bar"}')).toBe(true);
      expect(isJsonString('[]')).toBe(true);
      expect(isJsonString('"string"')).toBe(true);
      expect(isJsonString('123')).toBe(true);
      expect(isJsonString('true')).toBe(true);
      expect(isJsonString('null')).toBe(true);
    });

    it('should return false for invalid JSON strings', () => {
      expect(isJsonString('{')).toBe(false);
      expect(isJsonString('undefined')).toBe(false);
      expect(isJsonString("{'foo': 'bar'}")).toBe(false); // Single quotes
      expect(isJsonString('NaN')).toBe(false);
      expect(isJsonString('')).toBe(false);
    });
  });

  describe('safeJsonParse', () => {
    it('should parse valid JSON', () => {
      expect(safeJsonParse('{"foo": "bar"}', null)).toEqual({ foo: 'bar' });
      expect(safeJsonParse('[1, 2, 3]', [])).toEqual([1, 2, 3]);
      expect(safeJsonParse('"hello"', '')).toBe('hello');
      expect(safeJsonParse('123', 0)).toBe(123);
    });

    it('should return fallback for invalid JSON', () => {
      expect(safeJsonParse('invalid', 'fallback')).toBe('fallback');
      expect(safeJsonParse('{', {})).toEqual({});
      expect(safeJsonParse('undefined', null)).toBeNull();
    });

    it('should handle complex fallback values', () => {
      const fallback = { default: true };
      expect(safeJsonParse('bad json', fallback)).toBe(fallback);
    });

    it('should preserve type with generic parameter', () => {
      interface TestType {
        id: number;
        name: string;
      }
      const result = safeJsonParse<TestType>('{"id": 1, "name": "test"}', { id: 0, name: '' });
      expect(result).toEqual({ id: 1, name: 'test' });
    });
  });

  describe('safeJsonStringify', () => {
    it('should stringify objects', () => {
      expect(safeJsonStringify({ foo: 'bar' })).toBe('{\n  "foo": "bar"\n}');
      expect(safeJsonStringify([1, 2, 3])).toBe('[\n  1,\n  2,\n  3\n]');
    });

    it('should stringify primitives', () => {
      expect(safeJsonStringify('hello')).toBe('"hello"');
      expect(safeJsonStringify(123)).toBe('123');
      expect(safeJsonStringify(true)).toBe('true');
      expect(safeJsonStringify(null)).toBe('null');
    });

    it('should handle circular references', () => {
      const circular: Record<string, unknown> = { a: 1 };
      circular.self = circular;

      const result = safeJsonStringify(circular);
      expect(result).toBe('[object Object]');
    });

    it('should handle objects with toJSON method', () => {
      const obj = {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        toJSON(): { custom: string } {
          return { custom: 'value' };
        },
      };
      expect(safeJsonStringify(obj)).toBe('{\n  "custom": "value"\n}');
    });

    it('should support custom indentation', () => {
      expect(safeJsonStringify({ a: 1 }, 0)).toBe('{"a":1}');
      expect(safeJsonStringify({ a: 1 }, 4)).toBe('{\n    "a": 1\n}');
    });

    it('should handle undefined by returning string representation', () => {
      expect(safeJsonStringify(undefined)).toBe('undefined');
    });

    it('should handle functions by returning undefined from JSON.stringify', () => {
      const fn = (): string => 'test';
      // JSON.stringify returns undefined for functions, which we then convert to 'undefined'
      expect(safeJsonStringify(fn)).toBe('undefined');
    });
  });
});
