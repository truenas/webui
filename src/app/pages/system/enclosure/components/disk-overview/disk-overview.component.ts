import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Disk } from 'app/interfaces/storage.interface';

@Component({
  selector: 'ix-disk-overview',
  templateUrl: './disk-overview.component.html',
  styleUrls: ['./disk-overview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiskOverviewComponent {
  @Input() disk: Disk;
}
