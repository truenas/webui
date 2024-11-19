import { SelectionModel } from '@angular/cdk/collections';
import {
  Component, ChangeDetectionStrategy,
  signal, computed, inject,
  effect,
} from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { EmptyType } from 'app/enums/empty-type.enum';
import { Role } from 'app/enums/role.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import { VirtualizationInstance } from 'app/interfaces/virtualization.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { InstanceRowComponent } from 'app/pages/virtualization/components/all-instances/instance-list/instance-row/instance-row.component';
import { VirtualizationDevicesStore } from 'app/pages/virtualization/stores/virtualization-devices.store';
import { VirtualizationInstancesStore } from 'app/pages/virtualization/stores/virtualization-instances.store';
import { VirtualizationViewStore } from 'app/pages/virtualization/stores/virtualization-view.store';
import { ApiService } from 'app/services/api.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-instance-list',
  templateUrl: './instance-list.component.html',
  styleUrls: ['./instance-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    TranslateModule,
    SearchInput1Component,
    FakeProgressBarComponent,
    InstanceRowComponent,
    MatCheckboxModule,
    EmptyComponent,
    TestDirective,
  ],
})

export class InstanceListComponent {
  protected readonly requireRoles = [Role.VirtInstanceWrite];
  protected readonly searchQuery = signal<string>('');
  protected readonly window = inject<Window>(WINDOW);
  protected readonly selection = new SelectionModel<string>(true, []);

  protected readonly instances = this.store.instances;
  protected readonly isLoading = this.store.isLoading;

  protected readonly selectedInstance = this.deviceStore.selectedInstance;
  protected readonly showMobileDetails = this.viewStore.showMobileDetails;
  protected readonly isMobileView = this.viewStore.isMobileView;

  protected readonly isAllSelected = computed(() => {
    return this.selection.selected.length === this.instances().length;
  });

  protected readonly filteredInstances = computed(() => {
    return this.instances()
      .filter((instance) => {
        return instance?.name?.toLocaleLowerCase()
          .includes(this.searchQuery().toLocaleLowerCase());
      });
  });

  protected readonly emptyConfig = computed<EmptyConfig>(() => {
    if (this.searchQuery()?.length && !this.filteredInstances()?.length) {
      return {
        type: EmptyType.NoSearchResults,
        title: this.translate.instant('No Search Results.'),
        message: this.translate.instant('No matching results found'),
        large: true,
      };
    }
    return {
      type: EmptyType.NoPageData,
      title: this.translate.instant('No instances'),
      message: this.translate.instant('Instances you created will automatically appear here.'),
      large: true,
    };
  });

  protected selectInstanceDetails = effect(() => {
    if (this.isLoading() || !this.instances()?.length) {
      return;
    }

    const instanceId = this.activatedRoute.snapshot.paramMap.get('id');
    if (instanceId) {
      this.selectForDetails(instanceId);
    } else {
      this.navigateToDetails(this.instances()[0]);
    }
  }, { allowSignalWrites: true });

  constructor(
    private store: VirtualizationInstancesStore,
    private viewStore: VirtualizationViewStore,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private ws: ApiService,
    private dialog: DialogService,
    private translate: TranslateService,
    private errorHandler: ErrorHandlerService,
    private deviceStore: VirtualizationDevicesStore,
  ) {}

  onSearch(query: string): void {
    this.searchQuery.set(query);
  }

  toggleAllChecked(checked: boolean): void {
    if (checked) {
      this.instances().forEach((instance) => this.selection.select(instance.id));
    } else {
      this.selection.clear();
    }
  }

  navigateToDetails(instance: VirtualizationInstance): void {
    this.selectForDetails(instance.id);
    this.router.navigate(['/virtualization', 'view', instance.id]);

    if (this.isMobileView()) {
      this.viewStore.setMobileDetails(true);

      setTimeout(() => (this.window.document.getElementsByClassName('mobile-back-button')?.[0] as HTMLElement)?.focus(), 0);
    }
  }

  restart(instanceId: string): void {
    this.dialog.jobDialog(
      this.ws.job('virt.instance.restart', [instanceId, {}]),
      { title: this.translate.instant('Restarting...') },
    )
      .afterClosed()
      .pipe(this.errorHandler.catchError(), untilDestroyed(this))
      .subscribe();
  }

  start(instanceId: string): void {
    this.dialog.jobDialog(
      this.ws.job('virt.instance.start', [instanceId]),
      { title: this.translate.instant('Starting...') },
    )
      .afterClosed()
      .pipe(this.errorHandler.catchError(), untilDestroyed(this))
      .subscribe();
  }

  stop(instanceId: string): void {
    this.dialog.jobDialog(
      this.ws.job('virt.instance.stop', [instanceId, {}]),
      { title: this.translate.instant('Stopping...') },
    )
      .afterClosed()
      .pipe(this.errorHandler.catchError(), untilDestroyed(this))
      .subscribe();
  }

  private selectForDetails(instanceId: string): void {
    if (!this.instances()?.length) return;

    const selected = this.instances()?.find((instance) => instance.id === instanceId);
    if (selected) {
      this.deviceStore.selectInstance(selected);
    }
  }
}
