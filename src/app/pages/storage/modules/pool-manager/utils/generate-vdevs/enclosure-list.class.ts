import { DetailsDisk } from 'app/interfaces/disk.interface';

export class EnclosureList {
  lastUsedEnclosure = 0;

  private readonly enclosureIds: (string | undefined)[];

  constructor(
    disks: DetailsDisk[],
  ) {
    this.enclosureIds = this.getEnclosureIds(disks);
  }

  next(): string | undefined {
    const next = this.enclosureIds[this.lastUsedEnclosure];
    this.lastUsedEnclosure = (this.lastUsedEnclosure + 1) % this.enclosureIds.length;
    return next;
  }

  private getEnclosureIds(disks: DetailsDisk[]): (string | undefined)[] {
    const enclosures = new Set<string | undefined>();
    for (const disk of disks) {
      enclosures.add(disk.enclosure?.id);
    }
    return [...enclosures];
  }
}
