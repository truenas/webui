import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { DiskType } from 'app/enums/disk-type.enum';
import { Disk } from 'app/interfaces/storage.interface';

@Component({
  selector: 'ix-disk-icon',
  templateUrl: './disk-icon.component.svg',
  styleUrls: ['./disk-icon.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiskIconComponent {
  @Input() disk: Disk;

  protected readonly DiskType = DiskType;
}
