import {
  ChangeDetectionStrategy, Component, EventEmitter, Input, Output,
} from '@angular/core';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: '[ixDriveTray]',
  templateUrl: './drive-tray.component.svg',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriveTrayComponent {
  highlight: boolean;
  @Input() slot: number;
  @Input() empty: boolean;
  @Input() selected: boolean;
  @Input() diskName?: string;
  @Output() selectDisk = new EventEmitter<string>();
}
