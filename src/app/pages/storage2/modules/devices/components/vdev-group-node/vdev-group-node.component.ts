import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { VDevGroup } from 'app/interfaces/device-nested-data-node.interface';

@UntilDestroy()
@Component({
  selector: 'ix-vdev-group-node',
  templateUrl: './vdev-group-node.component.html',
  styleUrls: ['./vdev-group-node.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VDevGroupNodeComponent {
  @Input() vdevGroup: VDevGroup;
}
