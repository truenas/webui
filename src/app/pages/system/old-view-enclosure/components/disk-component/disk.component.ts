import {
  ChangeDetectionStrategy, Component, Input,
} from '@angular/core';

@Component({
  selector: 'ix-disk-ui',
  templateUrl: './disk.component.html',
  styleUrls: ['./disk.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiskComponent {
  @Input() data: {
    name: string;
    type?: string;
  };
}
