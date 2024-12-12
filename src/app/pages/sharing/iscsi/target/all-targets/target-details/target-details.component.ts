import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { IscsiTargetMode } from 'app/enums/iscsi.enum';
import { IscsiTarget } from 'app/interfaces/iscsi.interface';
import { AssociatedExtentsCardComponent } from 'app/pages/sharing/iscsi/target/all-targets/target-details/associated-extents-card/associated-extents-card.component';
import {
  AuthorizedNetworksCardComponent,
} from 'app/pages/sharing/iscsi/target/all-targets/target-details/authorized-networks-card/authorized-networks-card.component';

@Component({
  selector: 'ix-target-details',
  templateUrl: './target-details.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AuthorizedNetworksCardComponent,
    AssociatedExtentsCardComponent,
  ],
})
export class TargetDetailsComponent {
  readonly target = input.required<IscsiTarget>();

  protected hasIscsiCards = computed(() => [IscsiTargetMode.Iscsi, IscsiTargetMode.Both].includes(this.target().mode));
}
