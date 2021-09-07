import {
  Component, Input,
} from '@angular/core';

@Component({
  selector: 'disk-ui',
  templateUrl: './disk.component.html',
  styleUrls: ['./disk.component.scss'],
})
export class DiskComponent {
  @Input() data: any;
}
