import { ElementRef } from '@angular/core';
import { EnclosureView, SelectedEnclosureSlot } from 'app/interfaces/enclosure.interface';
import { Theme } from 'app/interfaces/theme.interface';
import { DriveTray } from 'app/pages/system/view-enclosure/classes/drivetray';
import { ErrorMessage } from 'app/pages/system/view-enclosure/interfaces/error-message.interface';

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
  sender?: unknown;
  data: ChangeDriveTrayOptions;
}

export interface ChangeDriveTrayOptions {
  id: string | number;
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

export interface ChassisLoadedEvent {
  name: 'ChassisLoaded';
  sender: unknown;
}

export interface DriveSelectedEvent {
  name: 'DriveSelected';
  data: DriveTray;
}

export interface ReadyEvent {
  name: 'Ready';
}

export interface ThemeChangedEvent {
  name: 'ThemeChanged';
  sender: unknown;
  data: Theme;
}

export interface LabelDrivesEvent {
  name: 'LabelDrives';
  sender: unknown;
  data: SelectedEnclosureSlot;
}

export interface CanvasExtractEvent {
  name: 'CanvasExtract';
  sender: unknown;
  data: EnclosureView;
}

export interface EnclosureSelectedEvent {
  name: 'EnclosureSelected';
  sender: unknown;
}

export interface VisualizerReadyEvent {
  name: 'VisualizerReady';
  sender: unknown;
}

export interface ErrorEvent {
  name: 'Error';
  data: ErrorMessage;
}

export interface PoolsChangedEvent {
  name: 'PoolsChanged';
}

export interface UnhighlightDiskEvent {
  name: 'UnhighlightDisk';
  sender: unknown;
  data: {
    devname: string;
    overlay: ElementRef<HTMLElement>;
  };
}

export interface EnableHighlightMode {
  name: 'EnableHighlightMode';
  sender: unknown;
}

export interface DisableHighlightMode {
  name: 'DisableHighlightMode';
  sender: unknown;
}

export type EnclosureEvent =
  | LabelDrivesEvent
  | EnclosureCanvasEvent
  | ChangeDriveTrayColorEvent
  | HighlightDiskEvent
  | ChassisLoadedEvent
  | DriveSelectedEvent
  | ReadyEvent
  | ThemeChangedEvent
  | CanvasExtractEvent
  | EnclosureSelectedEvent
  | VisualizerReadyEvent
  | ErrorEvent
  | PoolsChangedEvent
  | UnhighlightDiskEvent
  | EnableHighlightMode
  | DisableHighlightMode;
