import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { DetailsDisk } from 'app/interfaces/disk.interface';

@Component({
  selector: 'ix-disk-info',
  templateUrl: './disk-info.component.html',
  styleUrls: ['./disk-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [TranslateModule],
})
export class DiskInfoComponent {
  readonly disk = input.required<DetailsDisk>();
}
