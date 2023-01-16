import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'ix-disk-icon',
  templateUrl: './disk-icon.component.svg',
  styleUrls: ['./disk-icon.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiskIconComponent {
  @Input() identifier: string;
  @Input() size: string;
}
