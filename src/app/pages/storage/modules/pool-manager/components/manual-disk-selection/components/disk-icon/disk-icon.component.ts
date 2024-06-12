import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { DiskType } from 'app/enums/disk-type.enum';
import { DetailsDisk } from 'app/interfaces/disk.interface';

@Component({
  selector: 'ix-disk-icon',
  templateUrl: './disk-icon.component.svg',
  styleUrls: ['./disk-icon.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiskIconComponent {
  @Input() disk: DetailsDisk;

  protected readonly DiskType = DiskType;
}
