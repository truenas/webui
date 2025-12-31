import { generateUuid } from './uuid.helper';

describe('generateUuid', () => {
  const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  it('should generate a valid UUID v4 format', () => {
    const uuid = generateUuid();

    expect(uuid).toMatch(uuidV4Regex);
  });

  it('should generate unique UUIDs', () => {
    const uuids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      uuids.add(generateUuid());
    }

    expect(uuids.size).toBe(100);
  });

  describe('getRandomValues fallback', () => {
    let originalRandomUuid: typeof crypto.randomUUID;

    beforeEach(() => {
      originalRandomUuid = crypto.randomUUID;
      (crypto as { randomUUID?: typeof crypto.randomUUID }).randomUUID = undefined;
    });

    afterEach(() => {
      crypto.randomUUID = originalRandomUuid;
    });

    it('should generate valid UUID v4 using getRandomValues', () => {
      const uuid = generateUuid();

      expect(uuid).toMatch(uuidV4Regex);
    });

    it('should generate unique UUIDs with getRandomValues', () => {
      const uuids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        uuids.add(generateUuid());
      }

      expect(uuids.size).toBe(100);
    });

    it('should have correct version and variant bits with getRandomValues', () => {
      const uuid = generateUuid();

      expect(uuid[14]).toBe('4');
      expect(['8', '9', 'a', 'b']).toContain(uuid[19]);
    });
  });

  describe('Math.random fallback', () => {
    let originalRandomUuid: typeof crypto.randomUUID;
    let originalGetRandomValues: typeof crypto.getRandomValues;

    beforeEach(() => {
      originalRandomUuid = crypto.randomUUID;
      originalGetRandomValues = crypto.getRandomValues;
      (crypto as { randomUUID?: typeof crypto.randomUUID }).randomUUID = undefined;
      (crypto as { getRandomValues?: typeof crypto.getRandomValues }).getRandomValues = undefined;
    });

    afterEach(() => {
      crypto.randomUUID = originalRandomUuid;
      crypto.getRandomValues = originalGetRandomValues;
    });

    it('should generate valid UUID v4 using Math.random', () => {
      const uuid = generateUuid();

      expect(uuid).toMatch(uuidV4Regex);
    });

    it('should generate unique UUIDs with Math.random', () => {
      const uuids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        uuids.add(generateUuid());
      }

      expect(uuids.size).toBe(100);
    });

    it('should have correct version and variant bits with Math.random', () => {
      const uuid = generateUuid();

      expect(uuid[14]).toBe('4');
      expect(['8', '9', 'a', 'b']).toContain(uuid[19]);
    });
  });
});
