import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { Router, NavigationStart } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  distinctUntilChanged, filter, map,
} from 'rxjs';
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
import { VirtualizationInstancesStore } from 'app/pages/instances/stores/virtualization-instances.store';

@UntilDestroy()
@Component({
  selector: 'ix-all-instances',
  templateUrl: './all-instances.component.html',
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
  private configStore = inject(VirtualizationConfigStore);
  private instancesStore = inject(VirtualizationInstancesStore);
  private router = inject(Router);
  private dialogService = inject(DialogService);
  private window = inject<Window>(WINDOW);
  private translate = inject(TranslateService);

  readonly selectedInstance = this.instancesStore.selectedInstance;

  protected readonly searchableElements = allInstancesElements;

  constructor() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationStart), untilDestroyed(this))
      .subscribe(() => {
        if (this.router.currentNavigation()?.extras?.state?.hideMobileDetails) {
          this.instancesStore.resetInstance();
        }
      });
  }

  ngOnInit(): void {
    this.configStore.initialize();
    this.instancesStore.initialize();

    this.configStore.state$.pipe(
      filter((state) => Boolean(state?.config)),
      map((state) => state.config.state),
      distinctUntilChanged(),
      untilDestroyed(this),
    ).subscribe(() => this.instancesStore.initialize());

    const showVmInstancesWarning = !this.window.localStorage.getItem('showNewVmInstancesWarning');

    if (showVmInstancesWarning) {
      this.dialogService.closeAllDialogs();

      this.dialogService.warn(
        this.translate.instant('Warning'),
        this.translate.instant('Containers are experimental and only recommended for advanced users. Make all configuration changes using the TrueNAS UI. Operations using the command line are not supported.'),
      ).pipe(untilDestroyed(this)).subscribe(() => {
        this.window.localStorage.setItem('showNewVmInstancesWarning', 'true');
      });
    }
  }
}
