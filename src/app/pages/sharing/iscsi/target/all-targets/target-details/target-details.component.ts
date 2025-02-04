import {
  ChangeDetectionStrategy, Component, computed, effect, input,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { finalize, take } from 'rxjs';
import { IscsiTargetMode } from 'app/enums/iscsi.enum';
import { FibreChannelPort } from 'app/interfaces/fibre-channel.interface';
import { IscsiTarget } from 'app/interfaces/iscsi.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { AssociatedExtentsCardComponent } from 'app/pages/sharing/iscsi/target/all-targets/target-details/associated-extents-card/associated-extents-card.component';
import {
  AuthorizedNetworksCardComponent,
} from 'app/pages/sharing/iscsi/target/all-targets/target-details/authorized-networks-card/authorized-networks-card.component';
import { FibreChannelConnectionsCardComponent } from 'app/pages/sharing/iscsi/target/all-targets/target-details/fibre-channel-connections-card/fibre-channel-connections-card.component';
import { FibreChannelPortCardComponent } from 'app/pages/sharing/iscsi/target/all-targets/target-details/fibre-channel-port-card/fibre-channel-port-card.component';
import { IscsiConnectionsCardComponent } from 'app/pages/sharing/iscsi/target/all-targets/target-details/iscsi-connections-card/iscsi-connections-card.component';

@UntilDestroy()
@Component({
  selector: 'ix-target-details',
  templateUrl: './target-details.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AuthorizedNetworksCardComponent,
    FibreChannelPortCardComponent,
    FibreChannelConnectionsCardComponent,
    AssociatedExtentsCardComponent,
    IscsiConnectionsCardComponent,
  ],
})
export class TargetDetailsComponent {
  readonly target = input.required<IscsiTarget>();

  targetPort = signal<FibreChannelPort | null>(null);
  isLoading = signal<boolean>(false);

  connections = toSignal(this.api.call('fcport.status'));

  protected hasIscsiCards = computed(() => [
    IscsiTargetMode.Iscsi,
    IscsiTargetMode.Both,
  ].includes(this.target().mode));

  protected hasFibreCards = computed(() => [
    IscsiTargetMode.Fc,
    IscsiTargetMode.Both,
  ].includes(this.target().mode));

  constructor(
    private api: ApiService,
  ) {
    effect(() => {
      const targetId = this.target().id;
      this.targetPort.set(null);

      if (targetId) {
        this.getPortByTargetId(targetId);
      }
    });
  }

  private getPortByTargetId(id: number): void {
    this.isLoading.set(true);

    this.api.call('fcport.query', [[['target.id', '=', id]]])
      .pipe(
        take(1),
        finalize(() => this.isLoading.set(false)),
        untilDestroyed(this),
      )
      .subscribe((ports) => {
        this.targetPort.set(ports[0] || null);
      });
  }
}
