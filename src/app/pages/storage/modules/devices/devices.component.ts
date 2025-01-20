import {
  ChangeDetectionStrategy, Component, signal, OnInit,
} from '@angular/core';
import { MatAnchor } from '@angular/material/button';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { DevicesListComponent } from 'app/pages/storage/modules/devices/components/devies-list/devices-list.component';

@UntilDestroy()
@Component({
  selector: 'ix-devices',
  templateUrl: './devices.component.html',
  styleUrls: ['./devices.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DevicesListComponent,
    PageHeaderComponent,
    RequiresRolesDirective,
    TestDirective,
    RouterLink,
    TranslateModule,
    MatAnchor,
  ],
})
export class DevicesComponent implements OnInit {
  protected poolId = signal<number>(null);
  protected poolName = signal<string>(null);

  protected readonly requiredRoles = [Role.FullAdmin];

  get pageTitle(): string {
    return this.poolName
      ? this.translate.instant('{name} Devices', { name: this.poolName })
      : this.translate.instant('Devices');
  }

  constructor(
    private route: ActivatedRoute,
    private translate: TranslateService,
    private api: ApiService,
  ) { }

  ngOnInit(): void {
    this.poolId.set(Number(this.route.snapshot.paramMap.get('poolId')));
    this.getPool();
  }

  private getPool(): void {
    this.api.call('pool.query', [[['id', '=', this.poolId()]]]).pipe(untilDestroyed(this)).subscribe((pools) => {
      if (pools.length) {
        this.poolName.set(pools[0]?.name);
      }
    });
  }
}
