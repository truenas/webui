import {
  ChangeDetectionStrategy, Component, computed, input, signal,
} from '@angular/core';
import {
  MatCard, MatCardContent, MatCardHeader, MatCardTitle,
} from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { IscsiTarget } from 'app/interfaces/iscsi.interface';
import { Option } from 'app/interfaces/option.interface';
import { IscsiService } from 'app/services/iscsi.service';

@UntilDestroy()
@Component({
  selector: 'ix-iscsi-groups-card',
  templateUrl: './iscsi-groups-card.component.html',
  styleUrls: ['./iscsi-groups-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
    TranslateModule,
  ],
})
export class IscsiGroupsCardComponent {
  readonly target = input.required<IscsiTarget>();

  constructor(
    private iscsiService: IscsiService,
    private translate: TranslateService,
  ) {
    this.loadPortals();
    this.loadInitiators();
  }

  readonly portals = signal<Option[]>([]);
  readonly initiators = signal<Option[]>([]);

  private loadPortals(): void {
    this.iscsiService.listPortals().pipe(
      untilDestroyed(this),
    ).subscribe((portals) => {
      const opts: Option[] = portals.map((portal) => ({
        label: portal.comment ? `${portal.id} (${portal.comment})` : String(portal.id),
        value: portal.id,
      }));
      this.portals.set(opts);
    });
  }

  private loadInitiators(): void {
    this.iscsiService.getInitiators().pipe(
      untilDestroyed(this),
    ).subscribe((initiators) => {
      const opts: Option[] = initiators.map((initiator) => {
        const initiatorsAllowed = initiator.initiators.length === 0
          ? this.translate.instant('ALL Initiators Allowed')
          : initiator.initiators.toString();
        return {
          label: `${initiator.id} (${initiatorsAllowed})`,
          value: initiator.id,
        };
      });
      this.initiators.set(opts);
    });
  }

  readonly targetGroups = computed(() => {
    const target = this.target();
    const portals = this.portals();
    const initiators = this.initiators();

    const portalMap = new Map(portals.map((portal) => [portal.value, portal.label]));
    const initiatorMap = new Map(initiators.map((initiator) => [initiator.value, initiator.label]));

    return target.groups.map((group) => ({
      portalLabel: portalMap.get(group.portal),
      initiatorLabel: group.initiator ? initiatorMap.get(group.initiator) : '-',
      authmethod: group.authmethod,
      auth: group.auth ?? '-',
    }));
  });
}
