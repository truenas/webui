import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { DiskType } from 'app/enums/disk-type.enum';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';

@Component({
  selector: 'ix-disk-icon',
  templateUrl: './disk-icon.component.svg',
  styleUrls: ['./disk-icon.component.scss'],
  standalone: true,
  imports: [
    FileSizePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiskIconComponent {
  readonly size = input.required<number>();
  readonly type = input.required<DiskType>();
  readonly name = input.required<string>();

  protected readonly DiskType = DiskType;
}
