import {
  ChangeDetectionStrategy, Component, OnInit,
} from '@angular/core';
import { Router, NavigationStart } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { filter } from 'rxjs';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { MasterDetailViewComponent } from 'app/modules/master-detail-view/master-detail-view.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import {
  AllInstancesHeaderComponent,
} from 'app/pages/virtualization/components/all-instances/all-instances-header/all-instances-header.component';
import { allInstancesElements } from 'app/pages/virtualization/components/all-instances/all-instances.elements';
import { InstanceDetailsComponent } from 'app/pages/virtualization/components/all-instances/instance-details/instance-details.component';
import { InstanceListComponent } from 'app/pages/virtualization/components/all-instances/instance-list/instance-list.component';
import { VirtualizationConfigStore } from 'app/pages/virtualization/stores/virtualization-config.store';
import { VirtualizationDevicesStore } from 'app/pages/virtualization/stores/virtualization-devices.store';
import { VirtualizationInstancesStore } from 'app/pages/virtualization/stores/virtualization-instances.store';

@UntilDestroy()
@Component({
  selector: 'ix-all-instances',
  templateUrl: './all-instances.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    TranslateModule,
    AllInstancesHeaderComponent,
    InstanceDetailsComponent,
    InstanceListComponent,
    MasterDetailViewComponent,
    UiSearchDirective,
  ],
})
export class AllInstancesComponent implements OnInit {
  readonly selectedInstance = this.deviceStore.selectedInstance;

  protected readonly searchableElements = allInstancesElements;

  constructor(
    private configStore: VirtualizationConfigStore,
    private instancesStore: VirtualizationInstancesStore,
    private deviceStore: VirtualizationDevicesStore,
    private router: Router,
  ) {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationStart), untilDestroyed(this))
      .subscribe(() => {
        if (this.router.getCurrentNavigation()?.extras?.state?.hideMobileDetails) {
          this.deviceStore.resetInstance();
        }
      });
  }

  ngOnInit(): void {
    this.configStore.initialize();
    this.instancesStore.initialize();
  }
}
