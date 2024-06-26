import { NgIf } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { DiskType } from 'app/enums/disk-type.enum';
import { IxFileSizePipe } from 'app/modules/pipes/ix-file-size/ix-file-size.pipe';

@Component({
  selector: 'ix-disk-icon',
  templateUrl: './disk-icon.component.svg',
  styleUrls: ['./disk-icon.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    IxFileSizePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiskIconComponent {
  readonly size = input.required<number>();
  readonly type = input.required<DiskType>();
  readonly name = input.required<string>();

  protected readonly DiskType = DiskType;
}
