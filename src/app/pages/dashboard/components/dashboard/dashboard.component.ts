import {
  CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray,
} from '@angular/cdk/drag-drop';
import {
  ChangeDetectionStrategy, Component, DestroyRef, HostListener, OnInit, computed, signal, inject,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent, TnEmptyComponent, TnTooltipDirective,
} from '@truenas/ui-components';
import { isEqual } from 'lodash-es';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { AnimateOutDirective } from 'app/directives/animate-out/animate-out.directive';
import { DisableFocusableElementsDirective } from 'app/directives/disable-focusable-elements/disable-focusable-elements.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { dashboardElements } from 'app/pages/dashboard/components/dashboard/dashboard.elements';
import { WidgetGroupComponent } from 'app/pages/dashboard/components/widget-group/widget-group.component';
import { WidgetGroupFormComponent } from 'app/pages/dashboard/components/widget-group-form/widget-group-form.component';
import { DashboardStore } from 'app/pages/dashboard/services/dashboard.store';
import { getDefaultWidgets } from 'app/pages/dashboard/services/get-default-widgets';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { WidgetGroup } from 'app/pages/dashboard/types/widget-group.interface';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { AppState } from 'app/store';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import { WidgetGroupControlsComponent } from './widget-group-controls/widget-group-controls.component';

@Component({
  selector: 'ix-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    TnButtonComponent,
    TnEmptyComponent,
    TnTooltipDirective,
    UiSearchDirective,
    NgxSkeletonLoaderModule,
    WidgetGroupControlsComponent,
    DisableFocusableElementsDirective,
    WidgetGroupComponent,
    TranslateModule,
    CdkDrag,
    CdkDropList,
    AnimateOutDirective,
  ],
  providers: [
    WidgetResourcesService,
    DashboardStore,
  ],
})
export class DashboardComponent implements OnInit {
  private dashboardStore = inject(DashboardStore);
  private errorHandler = inject(ErrorHandlerService);
  private formPanel = inject(FormSidePanelService);
  private translate = inject(TranslateService);
  private snackbar = inject(SnackbarService);
  private dialogService = inject(DialogService);
  private store$ = inject<Store<AppState>>(Store);
  private destroyRef = inject(DestroyRef);

  readonly searchableElements = dashboardElements;
  readonly isEditing = signal(false);
  readonly renderedGroups = signal<WidgetGroup[]>([]);
  readonly savedGroups = toSignal(this.dashboardStore.groups$);
  readonly isLoading = toSignal(this.dashboardStore.isLoading$);
  readonly isHaLicensed = toSignal(this.store$.select(selectIsHaLicensed));
  readonly isLoadingFirstTime = computed(() => this.isLoading() && this.savedGroups() === null);
  readonly removingGroups = signal(new Set<WidgetGroup>());

  readonly customLayout = computed(() => {
    return !isEqual(this.renderedGroups(), getDefaultWidgets(this.isHaLicensed()));
  });

  /** Tracks whether the card-editor side panel is open so the page-level Escape handler yields to it. */
  protected editorOpen = signal(false);

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
    if (this.editorOpen()) {
      // The card editor side panel owns Escape while it is open.
      return;
    }
    this.isEditing.set(false);
    this.renderedGroups.set(this.savedGroups() || []);
  }

  protected onAddGroup(): void {
    this.openEditor(undefined, null);
  }

  protected onEditGroup(i: number): void {
    this.openEditor(this.renderedGroups()[i], i);
  }

  /**
   * Opens the card editor in a shared side panel via {@link FormSidePanelService} (rather than a
   * per-page `<tn-side-panel>`). On save the editor hands back the edited group, which we merge
   * into the in-memory layout at `index` (or append when adding a new group).
   */
  private openEditor(group: WidgetGroup | undefined, index: number | null): void {
    this.editorOpen.set(true);
    const editor$ = this.formPanel.open<WidgetGroup>(WidgetGroupFormComponent, {
      title: this.translate.instant('Card Editor'),
      wide: true,
      testId: 'widget-group-editor',
      inputs: { initialGroup: group },
    });
    editor$.onSuccess((updatedGroup) => {
      this.renderedGroups.update((groups) => {
        if (index === null) {
          return [...groups, updatedGroup];
        }
        return groups.map((existing, i) => (i === index ? updatedGroup : existing));
      });
    }, this.destroyRef);
    editor$.onClose(() => this.editorOpen.set(false), this.destroyRef);
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
    this.removingGroups.update((removing) => {
      const newSet = new Set(removing);
      newSet.add(groupToRemove);
      return newSet;
    });
  }

  protected onGroupRemovalComplete(groupToRemove: WidgetGroup): void {
    this.renderedGroups.update((groups) => {
      return groups.filter((group) => group !== groupToRemove);
    });
    this.removingGroups.update((removing) => {
      const newSet = new Set(removing);
      newSet.delete(groupToRemove);
      return newSet;
    });
  }

  protected onSave(): void {
    this.dashboardStore.save(this.renderedGroups())
      .pipe(this.errorHandler.withErrorHandler(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.isEditing.set(false);
        this.snackbar.success(this.translate.instant('Dashboard settings saved'));
      });
  }

  protected onReset(): void {
    this.dialogService.confirm({
      title: this.translate.instant('Restore default cards'),
      message: this.translate.instant('Are you sure you want to restore the default set of cards?'),
      hideCheckbox: true,
      buttonText: this.translate.instant('Restore'),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.renderedGroups.set(getDefaultWidgets(this.isHaLicensed()));
        this.snackbar.success(this.translate.instant('Default cards restored'));
      });
  }

  protected isGroupRemoving(group: WidgetGroup): boolean {
    return this.removingGroups().has(group);
  }

  private loadGroups(): void {
    this.dashboardStore.groups$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((groups) => {
        if (this.isEditing()) {
          return;
        }

        this.renderedGroups.set(groups || []);
      });
  }
}
