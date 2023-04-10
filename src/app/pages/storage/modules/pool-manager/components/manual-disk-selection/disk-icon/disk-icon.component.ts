import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Disk } from 'app/interfaces/storage.interface';

@Component({
  selector: 'ix-disk-icon',
  templateUrl: './disk-icon.component.svg',
  styleUrls: ['./disk-icon.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiskIconComponent {
  @Input() disk: Disk;
}
