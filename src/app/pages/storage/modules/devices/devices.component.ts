import { BreakpointObserver, Breakpoints, BreakpointState } from '@angular/cdk/layout';
import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, signal, OnInit, AfterViewInit,
} from '@angular/core';
import { MatAnchor } from '@angular/material/button';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { map, Observable } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { TopologyItemType } from 'app/enums/v-dev-type.enum';
import { isTopologyDisk, TopologyItem } from 'app/interfaces/storage.interface';
import { MasterDetailViewComponent } from 'app/modules/master-detail-view/master-detail-view.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { CastPipe } from 'app/modules/pipes/cast/cast.pipe';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { DevicesListComponent } from 'app/pages/storage/modules/devices/components/devies-list/devices-list.component';
import { DiskDetailsPanelComponent } from 'app/pages/storage/modules/devices/components/disk-details-panel/disk-details-panel.component';
import { TopologyItemIconComponent } from 'app/pages/storage/modules/devices/components/topology-item-icon/topology-item-icon.component';
import { DevicesStore } from 'app/pages/storage/modules/devices/stores/devices-store.service';

const raidzItems = [TopologyItemType.Raidz, TopologyItemType.Raidz1, TopologyItemType.Raidz2, TopologyItemType.Raidz3];

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
    CastPipe,
    DiskDetailsPanelComponent,
    MasterDetailViewComponent,
    AsyncPipe,
    TopologyItemIconComponent,
  ],
})
export class DevicesComponent implements OnInit, AfterViewInit {
  protected poolId = signal<number>(null);
  protected poolName = signal<string>(null);

  protected readonly requiredRoles = [Role.FullAdmin];

  protected isMobileView = signal(false);
  protected showMobileDetails = signal(false);

  protected selectedParentNode$ = this.devicesStore.selectedParentNode$;
  protected disksWithSmartTestSupport$ = this.devicesStore.disksWithSmartTestSupport$;
  protected selectedTopologyCategory$ = this.devicesStore.selectedTopologyCategory$;
  protected selectedNode$ = this.devicesStore.selectedNode$;
  protected readonly hasTopLevelRaidz$: Observable<boolean> = this.devicesStore.nodes$.pipe(
    map((node) => {
      return node.some((nodeItem) => nodeItem.children.some((child: TopologyItem) => {
        return raidzItems.includes(child.type);
      }));
    }),
  );

  protected getTitle(topologyItem: TopologyItem): string {
    if (isTopologyDisk(topologyItem)) {
      return topologyItem.disk || topologyItem.guid;
    }

    return topologyItem.type;
  }

  get pageTitle(): string {
    return this.poolName()
      ? this.translate.instant('{name} Devices', { name: this.poolName() })
      : this.translate.instant('Devices');
  }

  constructor(
    private route: ActivatedRoute,
    private translate: TranslateService,
    private api: ApiService,
    private breakpointObserver: BreakpointObserver,
    protected devicesStore: DevicesStore,
  ) { }

  ngOnInit(): void {
    this.poolId.set(Number(this.route.snapshot.paramMap.get('poolId')));
    this.getPool();
  }

  ngAfterViewInit(): void {
    this.breakpointObserver
      .observe([Breakpoints.XSmall, Breakpoints.Small, Breakpoints.Medium])
      .pipe(untilDestroyed(this))
      .subscribe((state: BreakpointState) => {
        if (state.matches) {
          this.isMobileView.set(true);
        } else {
          this.closeMobileDetails();
          this.isMobileView.set(false);
        }
      });
  }

  private getPool(): void {
    this.api.call('pool.query', [[['id', '=', this.poolId()]]]).pipe(untilDestroyed(this)).subscribe((pools) => {
      if (pools.length) {
        this.poolName.set(pools[0]?.name);
      }
    });
  }

  closeMobileDetails(): void {
    this.showMobileDetails.set(false);
  }
}
