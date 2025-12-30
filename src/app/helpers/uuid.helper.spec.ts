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

  describe('fallback implementation', () => {
    let originalRandomUuid: typeof crypto.randomUUID;

    beforeEach(() => {
      originalRandomUuid = crypto.randomUUID;
      (crypto as { randomUUID?: typeof crypto.randomUUID }).randomUUID = undefined;
    });

    afterEach(() => {
      crypto.randomUUID = originalRandomUuid;
    });

    it('should generate valid UUID v4 when crypto.randomUUID is unavailable', () => {
      const uuid = generateUuid();

      expect(uuid).toMatch(uuidV4Regex);
    });

    it('should generate unique UUIDs with fallback', () => {
      const uuids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        uuids.add(generateUuid());
      }

      expect(uuids.size).toBe(100);
    });
  });
});
