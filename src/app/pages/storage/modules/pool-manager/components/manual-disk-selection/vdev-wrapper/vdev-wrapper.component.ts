import { Component, Input } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { ManagerVdev } from 'app/interfaces/vdev-info.interface';

@UntilDestroy()
@Component({
  selector: 'ix-vdev-wrapper',
  templateUrl: './vdev-wrapper.component.html',
  styleUrls: ['./vdev-wrapper.component.scss'],
})
export class VdevWrapperComponent {
  @Input() enclosure: number;
  @Input() vdev: ManagerVdev;
}
