import { CastPipe } from './cast.pipe';

describe('CastPipe', () => {
  let pipe: CastPipe;

  beforeEach(() => {
    pipe = new CastPipe();
  });

  it('should create', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return the same value without transformation', () => {
    const inputValue = 'test string';
    const result = pipe.transform(inputValue);

    expect(result).toBe(inputValue);
    expect(result).toBe('test string');
  });

  it('should work with numbers', () => {
    const inputValue = 42;
    const result = pipe.transform(inputValue);

    expect(result).toBe(inputValue);
    expect(result).toBe(42);
  });

  it('should work with objects', () => {
    const inputValue = { id: 1, name: 'test' };
    const result = pipe.transform(inputValue);

    expect(result).toBe(inputValue);
    expect(result).toEqual({ id: 1, name: 'test' });
  });

  it('should work with arrays', () => {
    const inputValue = [1, 2, 3];
    const result = pipe.transform(inputValue);

    expect(result).toBe(inputValue);
    expect(result).toEqual([1, 2, 3]);
  });

  it('should work with null values', () => {
    const inputValue = null as string | null;
    const result = pipe.transform(inputValue);

    expect(result).toBe(inputValue);
    expect(result).toBeNull();
  });

  it('should work with undefined values', () => {
    const inputValue = undefined as string | undefined;
    const result = pipe.transform(inputValue);

    expect(result).toBe(inputValue);
    expect(result).toBeUndefined();
  });

  it('should work with boolean values', () => {
    const trueValue = true;
    const falseValue = false;

    expect(pipe.transform(trueValue)).toBe(true);
    expect(pipe.transform(falseValue)).toBe(false);
  });

  it('should maintain reference equality for objects', () => {
    const inputObject = { test: 'value' };
    const result = pipe.transform(inputObject);

    // Should be the exact same reference
    expect(result).toBe(inputObject);
  });

  it('should work with complex nested objects', () => {
    const complexObject = {
      id: 1,
      data: {
        nested: {
          value: [1, 2, 3],
          metadata: {
            created: new Date(),
            active: true,
          },
        },
      },
    };

    const result = pipe.transform(complexObject);

    expect(result).toBe(complexObject);
    expect(result).toEqual(complexObject);
  });
});
