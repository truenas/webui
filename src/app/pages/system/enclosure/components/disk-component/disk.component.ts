import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ix-disk-ui',
  templateUrl: './disk.component.html',
  styleUrls: ['./disk.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiskComponent {
  readonly data = input.required<{
    name: string;
    type?: string;
  }>();
}
