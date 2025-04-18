import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { VDevGroup } from 'app/interfaces/device-nested-data-node.interface';

@UntilDestroy()
@Component({
  selector: 'ix-vdev-group-node',
  templateUrl: './vdev-group-node.component.html',
  styleUrls: ['./vdev-group-node.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [TranslateModule],
})
export class VDevGroupNodeComponent {
  readonly vdevGroup = input.required<VDevGroup>();
}
