export interface SizeDisksMap {
  hdd: SizeDisksMapItem;
  ssd: SizeDisksMapItem;
}

export interface SizeDisksMapItem {
  [size: string]: number;
}
