import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TnTestIdDirective } from '@truenas/ui-components';
import { VDevGroup } from 'app/interfaces/device-nested-data-node.interface';

@Component({
  selector: 'ix-vdev-group-node',
  templateUrl: './vdev-group-node.component.html',
  styleUrls: ['./vdev-group-node.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TnTestIdDirective, TranslateModule],
})
export class VDevGroupNodeComponent {
  readonly vdevGroup = input.required<VDevGroup>();
}
