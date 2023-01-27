import { ElementRef } from '@angular/core';
import { EnclosureMetadata } from 'app/pages/system/view-enclosure/classes/system-profiler';

export interface EnclosureLabelChangedEvent {
  name: 'EnclosureLabelChanged';
  sender: unknown;
  data: {
    label: string;
    index: number;
    id: string;
  };
}

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
    profile: EnclosureMetadata;
  };
}
