import {
  ChangeDetectionStrategy, Component, computed, input, OnInit, signal,
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
export class IscsiGroupsCardComponent implements OnInit {
  readonly target = input.required<IscsiTarget>();

  protected readonly portals = signal<Option[]>([]);
  protected readonly initiators = signal<Option[]>([]);

  private readonly portalMap = computed(() => {
    return new Map(this.portals().map((portal) => [portal.value, portal.label]));
  });

  private readonly initiatorMap = computed(() => {
    return new Map(this.initiators().map((initiator) => [initiator.value, initiator.label]));
  });

  protected readonly targetGroups = computed(() => {
    const target = this.target();
    const portalMap = this.portalMap();
    const initiatorMap = this.initiatorMap();

    return target.groups.map((group) => ({
      portalLabel: portalMap.get(group.portal),
      initiatorLabel: group.initiator ? initiatorMap.get(group.initiator) : '-',
      authmethod: group.authmethod,
      auth: group.auth ?? '-',
    }));
  });

  constructor(
    private iscsiService: IscsiService,
    private translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.loadPortals();
    this.loadInitiators();
  }

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
}
