import { Component, Input } from '@angular/core';
import { ManagerVdev } from 'app/interfaces/vdev-info.interface';

@Component({
  selector: 'ix-vdev-wrapper',
  templateUrl: './vdev-wrapper.component.html',
  styleUrls: ['./vdev-wrapper.component.scss'],
})
export class VdevWrapperComponent {
  @Input() vdev: ManagerVdev;
}
