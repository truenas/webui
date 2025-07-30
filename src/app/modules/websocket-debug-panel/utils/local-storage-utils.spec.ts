import { LocalStorageError } from 'app/modules/websocket-debug-panel/interfaces/error.types';
import { safeGetItem, safeSetItem, safeRemoveItem } from './local-storage-utils';

describe('local-storage-utils', () => {
  let mockLocalStorage: Record<string, string>;

  beforeEach(() => {
    mockLocalStorage = {};

    // Mock localStorage
    Object.defineProperty(global, 'localStorage', {
      value: {
        getItem: jest.fn((key: string) => mockLocalStorage[key] || null),
        setItem: jest.fn((key: string, value: string) => {
          mockLocalStorage[key] = value;
        }),
        removeItem: jest.fn((key: string) => {
          delete mockLocalStorage[key];
        }),
      },
      writable: true,
    });

    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('safeGetItem', () => {
    it('should return default value when key does not exist', () => {
      const result = safeGetItem('nonexistent', 'default');
      expect(result).toBe('default');
    });

    it('should parse and return stored JSON value', () => {
      mockLocalStorage['test-key'] = JSON.stringify({ foo: 'bar' });

      const result = safeGetItem<{ foo: string }>('test-key', { foo: 'default' });
      expect(result).toEqual({ foo: 'bar' });
    });

    it('should return default value on parse error', () => {
      mockLocalStorage['test-key'] = 'invalid json';

      const result = safeGetItem('test-key', 'default');
      expect(result).toBe('default');
      expect(console.error).toHaveBeenCalledWith(
        'LocalStorage parse error:',
        expect.any(LocalStorageError),
      );
    });

    it('should return default value on read error', () => {
      (localStorage.getItem as jest.Mock).mockImplementation(() => {
        throw new Error('Read error');
      });

      const result = safeGetItem('test-key', 'default');
      expect(result).toBe('default');
      expect(console.error).toHaveBeenCalledWith(
        'LocalStorage read error:',
        expect.any(LocalStorageError),
      );
    });

    it('should handle complex objects', () => {
      const complexObject = {
        array: [1, 2, 3],
        nested: { a: 'b' },
        boolean: true,
        null: null as unknown,
      };
      mockLocalStorage['complex'] = JSON.stringify(complexObject);

      const result = safeGetItem('complex', {});
      expect(result).toEqual(complexObject);
    });
  });

  describe('safeSetItem', () => {
    it('should store JSON stringified value', async () => {
      await safeSetItem('test-key', { foo: 'bar' });

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'test-key',
        '{"foo":"bar"}',
      );
      expect(mockLocalStorage['test-key']).toBe('{"foo":"bar"}');
    });

    it('should handle primitive values', async () => {
      await safeSetItem('string', 'hello');
      await safeSetItem('number', 42);
      await safeSetItem('boolean', true);

      expect(mockLocalStorage['string']).toBe('"hello"');
      expect(mockLocalStorage['number']).toBe('42');
      expect(mockLocalStorage['boolean']).toBe('true');
    });

    it('should throw LocalStorageError on write failure', async () => {
      (localStorage.setItem as jest.Mock).mockImplementation(() => {
        throw new Error('Write error');
      });

      await expect(safeSetItem('test-key', 'value')).rejects.toThrow(LocalStorageError);
      expect(console.error).toHaveBeenCalledWith(
        'LocalStorage write error:',
        expect.any(LocalStorageError),
      );
    });

    it('should handle circular references gracefully', async () => {
      const circular: Record<string, unknown> = { a: 1 };
      circular.self = circular;

      await expect(safeSetItem('circular', circular)).rejects.toThrow(LocalStorageError);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('safeRemoveItem', () => {
    it('should remove item from localStorage', async () => {
      mockLocalStorage['test-key'] = 'value';

      await safeRemoveItem('test-key');

      expect(localStorage.removeItem).toHaveBeenCalledWith('test-key');
      expect(mockLocalStorage['test-key']).toBeUndefined();
    });

    it('should throw LocalStorageError on remove failure', async () => {
      (localStorage.removeItem as jest.Mock).mockImplementation(() => {
        throw new Error('Remove error');
      });

      await expect(safeRemoveItem('test-key')).rejects.toThrow(LocalStorageError);
      expect(console.error).toHaveBeenCalledWith(
        'LocalStorage remove error:',
        expect.any(LocalStorageError),
      );
    });

    it('should handle removing non-existent keys', async () => {
      await safeRemoveItem('nonexistent');

      expect(localStorage.removeItem).toHaveBeenCalledWith('nonexistent');
    });
  });

  describe('LocalStorageError properties', () => {
    it('should include all error properties', () => {
      const originalError = new Error('Original error');
      const error = new LocalStorageError(
        'Test message',
        'read',
        'test-key',
        originalError,
      );

      expect(error.message).toBe('Test message');
      expect(error.operation).toBe('read');
      expect(error.key).toBe('test-key');
      expect(error.cause).toBe(originalError);
      expect(error.name).toBe('LocalStorageError');
    });
  });
});
