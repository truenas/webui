import {
  Component, Input,
} from '@angular/core';

@Component({
  selector: 'ix-disk-ui',
  templateUrl: './disk.component.html',
  styleUrls: ['./disk.component.scss'],
})
export class DiskComponent {
  @Input() data: {
    name: string;
    type?: string;
  };
}
