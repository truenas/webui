import {
  animate, group as groupAnimations, style, transition, trigger,
} from '@angular/animations';
import {
  CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray,
} from '@angular/cdk/drag-drop';
import {
  ChangeDetectionStrategy, Component, HostListener, OnInit, computed, signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { isEqual } from 'lodash-es';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { DisableFocusableElementsDirective } from 'app/directives/disable-focusable-elements/disable-focusable-elements.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { EmptyType } from 'app/enums/empty-type.enum';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInResponse } from 'app/modules/slide-ins/slide-in.interface';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { dashboardElements } from 'app/pages/dashboard/components/dashboard/dashboard.elements';
import { WidgetGroupComponent } from 'app/pages/dashboard/components/widget-group/widget-group.component';
import { WidgetGroupFormComponent } from 'app/pages/dashboard/components/widget-group-form/widget-group-form.component';
import { DashboardStore } from 'app/pages/dashboard/services/dashboard.store';
import { getDefaultWidgets } from 'app/pages/dashboard/services/get-default-widgets';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { WidgetGroup } from 'app/pages/dashboard/types/widget-group.interface';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { AppState } from 'app/store';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import { WidgetGroupControlsComponent } from './widget-group-controls/widget-group-controls.component';

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
  standalone: true,
  imports: [
    PageHeaderComponent,
    MatButton,
    TestDirective,
    UiSearchDirective,
    NgxSkeletonLoaderModule,
    WidgetGroupControlsComponent,
    DisableFocusableElementsDirective,
    WidgetGroupComponent,
    EmptyComponent,
    TranslateModule,
    MatTooltip,
    CdkDrag,
    CdkDropList,
  ],
  providers: [
    WidgetResourcesService,
    DashboardStore,
  ],
})
export class DashboardComponent implements OnInit {
  readonly searchableElements = dashboardElements;
  readonly isEditing = signal(false);
  readonly renderedGroups = signal<WidgetGroup[]>([]);
  readonly savedGroups = toSignal(this.dashboardStore.groups$);
  readonly isLoading = toSignal(this.dashboardStore.isLoading$);
  readonly isHaLicensed = toSignal(this.store$.select(selectIsHaLicensed));
  readonly isLoadingFirstTime = computed(() => this.isLoading() && this.savedGroups() === null);

  readonly customLayout = computed(() => {
    return !isEqual(this.renderedGroups(), getDefaultWidgets(this.isHaLicensed()));
  });

  emptyDashboardConf: EmptyConfig = {
    type: EmptyType.NoPageData,
    large: true,
    icon: iconMarker('mdi-view-dashboard'),
    title: this.translate.instant('Your dashboard is currently empty!'),
    message: this.translate.instant('Start adding widgets to personalize it. Click on the "Configure" button to enter edit mode.'),
  };

  constructor(
    private dashboardStore: DashboardStore,
    private slideIn: SlideIn,
    private errorHandler: ErrorHandlerService,
    private translate: TranslateService,
    private snackbar: SnackbarService,
    private dialogService: DialogService,
    private store$: Store<AppState>,
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
      .open(WidgetGroupFormComponent, { wide: true })
      .pipe(untilDestroyed(this))
      .subscribe((response) => {
        const newGroup = response.response;
        if (!newGroup) {
          return;
        }

        this.renderedGroups.update((groups) => [...groups, newGroup]);
      });
  }

  protected onEditGroup(i: number): void {
    const editedGroup = this.renderedGroups()[i];
    this.slideIn
      .open(WidgetGroupFormComponent, { wide: true, data: editedGroup })
      .pipe(untilDestroyed(this))
      .subscribe((response: SlideInResponse<WidgetGroup>) => {
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

  protected onGroupsReordered(cdkEvent: CdkDragDrop<WidgetGroup[]>): void {
    this.renderedGroups.update((groups) => {
      const updatedGroups = [...groups];
      moveItemInArray(updatedGroups, cdkEvent.previousIndex, cdkEvent.currentIndex);
      return updatedGroups;
    });
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
    this.dialogService.confirm({
      title: this.translate.instant('Restore default widgets'),
      message: this.translate.instant('Are you sure you want to restore the default set of widgets?'),
      hideCheckbox: true,
      buttonText: this.translate.instant('Restore'),
    })
      .pipe(untilDestroyed(this))
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.renderedGroups.set(getDefaultWidgets(this.isHaLicensed()));
        this.snackbar.success(this.translate.instant('Default widgets restored'));
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
