import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'ix-disk-info',
  templateUrl: './disk-info.component.html',
  styleUrls: ['./disk-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiskInfoComponent {
  @Input() slot: number;
  @Input() type: string;
  @Input() model: string;
  @Input() serial: string;
}
