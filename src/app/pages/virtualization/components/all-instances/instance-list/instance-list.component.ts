import { SelectionModel } from '@angular/cdk/collections';
import {
  Component, ChangeDetectionStrategy,
  signal, computed, inject,
  effect,
  ChangeDetectorRef,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  filter,
  tap,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { EmptyType } from 'app/enums/empty-type.enum';
import { Role } from 'app/enums/role.enum';
import { VirtualizationStatus } from 'app/enums/virtualization.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import { VirtualizationInstance, VirtualizationStopParams } from 'app/interfaces/virtualization.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { InstanceRowComponent } from 'app/pages/virtualization/components/all-instances/instance-list/instance-row/instance-row.component';
import { StopOptionsDialogComponent, StopOptionsOperation } from 'app/pages/virtualization/components/all-instances/instance-list/stop-options-dialog/stop-options-dialog.component';
import { VirtualizationInstancesStore } from 'app/pages/virtualization/stores/virtualization-instances.store';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { ApiService } from 'app/services/websocket/api.service';

@UntilDestroy()
@Component({
  selector: 'ix-instance-list',
  templateUrl: './instance-list.component.html',
  styleUrls: ['./instance-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatButton,
    IxIconComponent,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    TranslateModule,
    SearchInput1Component,
    FakeProgressBarComponent,
    InstanceRowComponent,
    MatCheckboxModule,
    EmptyComponent,
    RequiresRolesDirective,
    TestDirective,
  ],
})

export class InstanceListComponent {
  protected readonly searchQuery = signal<string>('');
  protected readonly showMobileDetails = signal<boolean>(false);
  protected readonly isMobileView = signal(false);
  protected readonly window = inject<Window>(WINDOW);
  protected readonly selection = new SelectionModel<string>(true, []);
  protected readonly requiredRoles = [Role.VirtInstanceWrite];

  readonly bulkActionStartedMessage = this.translate.instant('Requested action performed for selected Instances');

  protected readonly instances = this.store.instances;
  protected readonly isLoading = this.store.isLoading;
  protected readonly selectedInstance = this.store.selectedInstance;

  get checkedInstancesIds(): string[] {
    return this.selection.selected;
  }

  get isAllSelected(): boolean {
    return this.selection.selected.length === this.filteredInstances().length;
  }

  get hasCheckedInstances(): boolean {
    return this.checkedInstancesIds.length > 0;
  }

  protected readonly checkedInstances = computed(() => {
    return this.checkedInstancesIds.map((id) => this.instances().find((instance) => instance.id === id));
  });

  protected readonly isBulkStartDisabled = computed(() => {
    return this.checkedInstances().every(
      (instance) => [VirtualizationStatus.Running].includes(instance.status),
    );
  });

  protected readonly isBulkStopDisabled = computed(() => {
    return this.checkedInstances().every(
      (instance) => [VirtualizationStatus.Stopped].includes(instance.status),
    );
  });

  protected readonly activeCheckedInstances = computed(() => {
    return this.instances().filter(
      (instance) => [VirtualizationStatus.Running].includes(instance.status)
        && this.selection.isSelected(instance.id),
    );
  });

  protected readonly stoppedCheckedInstances = computed(() => {
    return this.instances().filter(
      (instance) => [VirtualizationStatus.Stopped].includes(instance.status)
        && this.selection.isSelected(instance.id),
    );
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
    const instanceId = this.activatedRoute.snapshot.paramMap.get('id');

    if (this.isLoading() || !this.instances()?.length) {
      return;
    }

    if (instanceId) {
      this.selectForDetails(instanceId);
    } else {
      this.navigateToDetails(this.instances()[0]);
    }
  }, { allowSignalWrites: true });

  constructor(
    private store: VirtualizationInstancesStore,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private translate: TranslateService,
    private snackbar: SnackbarService,
    private dialog: DialogService,
    private api: ApiService,
    private errorHandler: ErrorHandlerService,
    private matDialog: MatDialog,
    private cdr: ChangeDetectorRef,
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
      this.showMobileDetails.set(true);

      setTimeout(() => (this.window.document.getElementsByClassName('mobile-back-button')[0] as HTMLElement).focus(), 0);
    }
  }

  closeMobileDetails(): void {
    this.showMobileDetails.set(false);
  }

  onBulkStart(): void {
    this.stoppedCheckedInstances().forEach((instance) => this.start(instance.id));
    this.selection.clear();
    this.snackbar.success(this.translate.instant(this.bulkActionStartedMessage));
    this.cdr.markForCheck();
  }

  onBulkStop(): void {
    this.matDialog
      .open(StopOptionsDialogComponent, { data: StopOptionsOperation.Stop })
      .afterClosed()
      .pipe(
        filter(Boolean),
        tap((options: VirtualizationStopParams) => {
          this.activeCheckedInstances().forEach((instance) => this.stop(instance.id, options));
          this.snackbar.success(this.translate.instant(this.bulkActionStartedMessage));
          this.selection.clear();
          this.cdr.markForCheck();
        }),
        untilDestroyed(this),
      ).subscribe();
  }

  onBulkRestart(): void {
    this.matDialog
      .open(StopOptionsDialogComponent, { data: StopOptionsOperation.Restart })
      .afterClosed()
      .pipe(
        filter(Boolean),
        tap((options: VirtualizationStopParams) => {
          this.activeCheckedInstances().forEach((instance) => this.restart(instance.id, options));
          this.snackbar.success(this.translate.instant(this.bulkActionStartedMessage));
          this.selection.clear();
          this.cdr.markForCheck();
        }),
        untilDestroyed(this),
      ).subscribe();
  }

  private selectForDetails(instanceId: string): void {
    if (!this.instances()?.length) {
      return;
    }

    const selected = instanceId && this.instances().find((instance) => instance.id === instanceId);
    if (selected) {
      this.store.selectInstance(selected.id);
    }
  }

  private start(instanceId: string): void {
    this.api.job('virt.instance.start', [instanceId])
      .pipe(this.errorHandler.catchError(), untilDestroyed(this))
      .subscribe();
  }

  private stop(instanceId: string, options: VirtualizationStopParams): void {
    this.api.job('virt.instance.stop', [instanceId, options])
      .pipe(this.errorHandler.catchError(), untilDestroyed(this))
      .subscribe();
  }

  private restart(instanceId: string, options: VirtualizationStopParams): void {
    this.api.job('virt.instance.restart', [instanceId, options])
      .pipe(this.errorHandler.catchError(), untilDestroyed(this))
      .subscribe();
  }
}
