import { ElementRef } from '@angular/core';
import { EnclosureView } from 'app/interfaces/enclosure.interface';

export interface HighlightDiskEvent {
  name: 'HighlightDisk';
  sender: unknown;
  data: {
    devname: string;
    overlay: ElementRef;
  };
}

export interface ChangeDriveTrayColorEvent {
  name: 'ChangeDriveTrayColor';
  sender: unknown;
  data: ChangeDriveTrayOptions;
}

export interface ChangeDriveTrayOptions {
  id: string;
  color: string;
  enclosure?: number;
  slot?: number;
}

export interface EnclosureCanvasEvent {
  name: 'EnclosureCanvas';
  sender: unknown;
  data: {
    canvas: HTMLCanvasElement;
    enclosureView: EnclosureView;
  };
}
