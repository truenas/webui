import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DiskType } from 'app/enums/disk-type.enum';

@Component({
  selector: 'ix-enclosure-disk',
  templateUrl: './disk.component.html',
  styleUrls: ['./disk.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnclosureDiskComponent {
  readonly data = input.required<{
    // eslint-disable-next-line no-restricted-globals
    name: string;
    type?: DiskType;
  }>();
}
