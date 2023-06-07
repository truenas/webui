import { UnusedDisk } from 'app/interfaces/storage.interface';
import { EnclosureList } from 'app/pages/storage/modules/pool-manager/utils/generate-vdevs/enclosure-list.class';

describe('EnclosureList', () => {
  let enclosureList: EnclosureList;

  beforeEach(() => {
    const disks = [
      { enclosure: { number: 1 } },
      { enclosure: { number: 2 } },
      { enclosure: { number: 3 } },
      { enclosure: { number: 4 } },
    ] as UnusedDisk[];
    enclosureList = new EnclosureList(disks);
  });

  it('should return the next enclosure number in a round-robin fashion', () => {
    expect(enclosureList.next()).toBe(1);
    expect(enclosureList.next()).toBe(2);
    expect(enclosureList.next()).toBe(3);
    expect(enclosureList.next()).toBe(4);
    expect(enclosureList.next()).toBe(1); // Should wrap around
  });

  it('should handle disks without enclosure numbers', () => {
    const disks = [
      { enclosure: { number: 1 } },
      { enclosure: null },
      { enclosure: { number: 3 } },
      { enclosure: null },
    ] as UnusedDisk[];
    enclosureList = new EnclosureList(disks);
    expect(enclosureList.next()).toBe(1);
    expect(enclosureList.next()).toBeUndefined();
    expect(enclosureList.next()).toBe(3);
    expect(enclosureList.next()).toBe(1);
    expect(enclosureList.next()).toBeUndefined();
  });
});
