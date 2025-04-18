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
import { isTopologyDisk, VDevItem } from 'app/interfaces/storage.interface';
import { MasterDetailViewComponent } from 'app/modules/master-detail-view/master-detail-view.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { CastPipe } from 'app/modules/pipes/cast/cast.pipe';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { DiskDetailsPanelComponent } from 'app/pages/storage/modules/vdevs/components/disk-details-panel/disk-details-panel.component';
import { TopologyItemIconComponent } from 'app/pages/storage/modules/vdevs/components/topology-item-icon/topology-item-icon.component';
import { VDevsListComponent } from 'app/pages/storage/modules/vdevs/components/vdevs-list/vdevs-list.component';
import { VDevsStore } from 'app/pages/storage/modules/vdevs/stores/vdevs-store.service';

const raidzItems = [TopologyItemType.Raidz, TopologyItemType.Raidz1, TopologyItemType.Raidz2, TopologyItemType.Raidz3];

@UntilDestroy()
@Component({
  selector: 'ix-vdevs',
  templateUrl: './vdevs.component.html',
  styleUrls: ['./vdevs.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    VDevsListComponent,
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
export class VDevsComponent implements OnInit, AfterViewInit {
  protected poolId = signal<number | null>(null);
  protected poolName = signal<string>('');

  protected readonly requiredRoles = [Role.PoolWrite];

  protected isMobileView = signal(false);
  protected showMobileDetails = signal(false);

  protected selectedParentNode$ = this.vDevsStore.selectedParentNode$;
  protected selectedTopologyCategory$ = this.vDevsStore.selectedTopologyCategory$;
  protected selectedNode$ = this.vDevsStore.selectedNode$;
  protected readonly hasTopLevelRaidz$: Observable<boolean> = this.vDevsStore.nodes$.pipe(
    map((node) => {
      return node.some((nodeItem) => nodeItem.children.some((child: VDevItem) => {
        return raidzItems.includes(child.type);
      }));
    }),
  );

  protected getTitle(topologyItem: VDevItem): string {
    if (isTopologyDisk(topologyItem)) {
      return topologyItem.disk || topologyItem.guid;
    }

    return topologyItem.type;
  }

  get pageTitle(): string {
    return this.poolName()
      ? this.translate.instant('{name} VDEVs', { name: this.poolName() })
      : this.translate.instant('VDEVs');
  }

  constructor(
    private route: ActivatedRoute,
    private translate: TranslateService,
    private api: ApiService,
    private breakpointObserver: BreakpointObserver,
    protected vDevsStore: VDevsStore,
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
