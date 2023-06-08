import { UnusedDisk } from 'app/interfaces/storage.interface';

export class EnclosureList {
  lastUsedEnclosure = 0;

  private readonly enclosureNumbers: number[];

  constructor(
    disks: UnusedDisk[],
  ) {
    this.enclosureNumbers = this.getEnclosureNumbers(disks);
  }

  next(): number {
    const next = this.enclosureNumbers[this.lastUsedEnclosure];
    this.lastUsedEnclosure = (this.lastUsedEnclosure + 1) % this.enclosureNumbers.length;
    return next;
  }

  private getEnclosureNumbers(disks: UnusedDisk[]): number[] {
    const enclosures = new Set<number>();
    for (const disk of disks) {
      enclosures.add(disk.enclosure?.number);
    }
    return [...enclosures];
  }
}
