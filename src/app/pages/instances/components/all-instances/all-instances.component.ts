import {
  ChangeDetectionStrategy, Component, Inject, OnInit,
} from '@angular/core';
import { Router, NavigationStart } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { filter } from 'rxjs';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { WINDOW } from 'app/helpers/window.helper';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { MasterDetailViewComponent } from 'app/modules/master-detail-view/master-detail-view.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import {
  AllInstancesHeaderComponent,
} from 'app/pages/instances/components/all-instances/all-instances-header/all-instances-header.component';
import { allInstancesElements } from 'app/pages/instances/components/all-instances/all-instances.elements';
import { InstanceDetailsComponent } from 'app/pages/instances/components/all-instances/instance-details/instance-details.component';
import { InstanceListComponent } from 'app/pages/instances/components/all-instances/instance-list/instance-list.component';
import { VirtualizationConfigStore } from 'app/pages/instances/stores/virtualization-config.store';
import { VirtualizationDevicesStore } from 'app/pages/instances/stores/virtualization-devices.store';
import { VirtualizationInstancesStore } from 'app/pages/instances/stores/virtualization-instances.store';

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
    private dialogService: DialogService,
    @Inject(WINDOW) private window: Window,
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

    const showVmInstancesWarning = !this.window.localStorage.getItem('showNewVmInstancesWarning');

    if (showVmInstancesWarning) {
      this.dialogService.closeAllDialogs();

      this.dialogService.warn(
        'Warning',
        'Containers and virtual machines powered by Incus are experimental and only recommended for advanced users. Make all configuration changes using the TrueNAS UI. Operations using the command line are not supported.',
      ).pipe(untilDestroyed(this)).subscribe(() => {
        this.window.localStorage.setItem('showNewVmInstancesWarning', 'true');
      });
    }
  }
}
