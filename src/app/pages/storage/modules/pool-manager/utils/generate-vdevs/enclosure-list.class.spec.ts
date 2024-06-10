import { DetailsDisk } from 'app/interfaces/disk.interface';
import { EnclosureList } from 'app/pages/storage/modules/pool-manager/utils/generate-vdevs/enclosure-list.class';

describe('EnclosureList', () => {
  let enclosureList: EnclosureList;

  beforeEach(() => {
    const disks = [
      { enclosure: { id: '1' } },
      { enclosure: { id: '2' } },
      { enclosure: { id: '3' } },
      { enclosure: { id: '4' } },
    ] as DetailsDisk[];
    enclosureList = new EnclosureList(disks);
  });

  it('should return the next enclosure id in a round-robin fashion', () => {
    expect(enclosureList.next()).toBe('1');
    expect(enclosureList.next()).toBe('2');
    expect(enclosureList.next()).toBe('3');
    expect(enclosureList.next()).toBe('4');
    expect(enclosureList.next()).toBe('1'); // Should wrap around
  });

  it('should handle disks without enclosure numbers', () => {
    const disks = [
      { enclosure: { id: '1' } },
      { enclosure: null },
      { enclosure: { id: '3' } },
      { enclosure: null },
    ] as DetailsDisk[];
    enclosureList = new EnclosureList(disks);
    expect(enclosureList.next()).toBe('1');
    expect(enclosureList.next()).toBeUndefined();
    expect(enclosureList.next()).toBe('3');
    expect(enclosureList.next()).toBe('1');
    expect(enclosureList.next()).toBeUndefined();
  });
});
