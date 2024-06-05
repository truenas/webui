import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { DetailsDisk } from 'app/interfaces/disk.interface';

@Component({
  selector: 'ix-disk-info',
  templateUrl: './disk-info.component.html',
  styleUrls: ['./disk-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiskInfoComponent {
  @Input() disk: DetailsDisk;
}
