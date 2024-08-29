import {
  animate, group as groupAnimations, style, transition, trigger,
} from '@angular/animations';
import { moveItemInArray } from '@angular/cdk/drag-drop';
import {
  ChangeDetectionStrategy, Component, HostListener, OnInit, computed, signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { isEqual } from 'lodash-es';
import { filter, switchMap } from 'rxjs';
import { EmptyType } from 'app/enums/empty-type.enum';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { dashboardElements } from 'app/pages/dashboard/components/dashboard/dashboard.elements';
import { WidgetGroupFormComponent } from 'app/pages/dashboard/components/widget-group-form/widget-group-form.component';
import { DashboardStore } from 'app/pages/dashboard/services/dashboard.store';
import { defaultWidgets } from 'app/pages/dashboard/services/default-widgets.constant';
import { WidgetGroup } from 'app/pages/dashboard/types/widget-group.interface';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { ChainedComponentResponse, IxChainedSlideInService } from 'app/services/ix-chained-slide-in.service';

@UntilDestroy()
@Component({
  selector: 'ix-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('groupRemovedTrigger', [
      transition(':leave', [
        groupAnimations([
          animate('200ms', style({ transform: 'scale(0.3)' })),
          animate('100ms', style({ opacity: 0 })),
        ]),
      ]),
    ]),
  ],
})
export class DashboardComponent implements OnInit {
  readonly searchableElements = dashboardElements;
  readonly isEditing = signal(false);
  readonly renderedGroups = signal<WidgetGroup[]>([]);
  readonly savedGroups = toSignal(this.dashboardStore.groups$);
  readonly isLoading = toSignal(this.dashboardStore.isLoading$);
  readonly isLoadingFirstTime = computed(() => this.isLoading() && this.savedGroups() === null);
  readonly newFeatureConfig = {
    key: 'dashboardConfigure',
    message: this.translate.instant('New widgets and layouts.'),
  };
  readonly customLayout = computed(() => {
    return !isEqual(this.savedGroups(), defaultWidgets);
  });

  emptyDashboardConf: EmptyConfig = {
    type: EmptyType.NoPageData,
    large: true,
    icon: 'view-dashboard',
    title: this.translate.instant('Your dashboard is currently empty!'),
    message: this.translate.instant('Start adding widgets to personalize it. Click on the "Configure" button to enter edit mode.'),
  };

  constructor(
    private dashboardStore: DashboardStore,
    private slideIn: IxChainedSlideInService,
    private errorHandler: ErrorHandlerService,
    private translate: TranslateService,
    private snackbar: SnackbarService,
    private dialog: DialogService,
  ) {}

  ngOnInit(): void {
    performance.mark('Dashboard Start');
    performance.measure('Admin Init', 'Admin Init', 'Dashboard Start');
    this.dashboardStore.entered();
    this.loadGroups();
  }

  protected onConfigure(): void {
    this.isEditing.set(true);
  }

  @HostListener('document:keydown.escape')
  protected onCancelConfigure(): void {
    this.isEditing.set(false);
    this.renderedGroups.set(this.savedGroups());
  }

  protected onAddGroup(): void {
    this.slideIn
      .open(WidgetGroupFormComponent, true)
      .pipe(untilDestroyed(this))
      .subscribe((response: ChainedComponentResponse<WidgetGroup>) => {
        if (!response.response) {
          return;
        }

        this.renderedGroups.update((groups) => [...groups, response.response]);
      });
  }

  protected onEditGroup(i: number): void {
    const editedGroup = this.renderedGroups()[i];
    this.slideIn
      .open(WidgetGroupFormComponent, true, editedGroup)
      .pipe(untilDestroyed(this))
      .subscribe((response: ChainedComponentResponse<WidgetGroup>) => {
        if (!response.response) {
          return;
        }

        this.renderedGroups.update((groups) => {
          return groups.map((group, index) => (index === i ? response.response : group));
        });
      });
  }

  protected onMoveGroup(index: number, direction: 1 | -1): void {
    this.renderedGroups.update((groups) => {
      const updatedGroups = [...groups];
      moveItemInArray(updatedGroups, index, index + direction);
      return updatedGroups;
    });
  }

  protected onGroupsReordered(groups: WidgetGroup[]): void {
    this.renderedGroups.set(groups);
  }

  protected onDeleteGroup(groupToRemove: WidgetGroup): void {
    this.renderedGroups.update((groups) => {
      return groups.filter((group) => group !== groupToRemove);
    });
  }

  protected onSave(): void {
    this.dashboardStore.save(this.renderedGroups())
      .pipe(this.errorHandler.catchError(), untilDestroyed(this))
      .subscribe(() => {
        this.isEditing.set(false);
        this.snackbar.success(this.translate.instant('Dashboard settings saved'));
      });
  }

  protected onReset(): void {
    this.dialog.confirm({
      title: this.translate.instant('Reset Dashboard'),
      message: this.translate.instant('Are you sure you want to reset your dashboard to the default layout?'),
      hideCheckbox: true,
      buttonText: this.translate.instant('Reset'),
      cancelText: this.translate.instant('Cancel'),
    }).pipe(
      filter(Boolean),
      switchMap(() => this.dashboardStore.save(defaultWidgets)),
      this.errorHandler.catchError(),
      untilDestroyed(this),
    ).subscribe(() => {
      this.isEditing.set(false);
      this.snackbar.success(this.translate.instant('Dashboard settings saved'));
    });
  }

  private loadGroups(): void {
    this.dashboardStore.groups$
      .pipe(untilDestroyed(this))
      .subscribe((groups) => {
        if (this.isEditing()) {
          return;
        }

        this.renderedGroups.set(groups);
      });
  }
}
