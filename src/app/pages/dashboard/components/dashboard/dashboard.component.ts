import {
  animate, group as groupAnimations, style, transition, trigger,
} from '@angular/animations';
import { moveItemInArray } from '@angular/cdk/drag-drop';
import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, ElementRef, HostListener,
  Inject, OnInit, QueryList, ViewChildren, computed, signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { EmptyType } from 'app/enums/empty-type.enum';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { dashboardElements } from 'app/pages/dashboard/components/dashboard/dashboard.elements';
import { WidgetGroupFormComponent } from 'app/pages/dashboard/components/widget-group-form/widget-group-form.component';
import { DashboardStore } from 'app/pages/dashboard/services/dashboard.store';
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
  @ViewChildren('groupElement', { read: ElementRef }) groupElements!: QueryList<ElementRef>;

  readonly searchableElements = dashboardElements;
  readonly isEditing = signal(false);
  readonly renderedGroups = signal<WidgetGroup[]>([]);
  readonly savedGroups = toSignal(this.dashboardStore.groups$);
  readonly isLoading = toSignal(this.dashboardStore.isLoading$);
  readonly isLoadingFirstTime = computed(() => this.isLoading() && this.savedGroups() === null);

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
    @Inject(DOCUMENT) private document: Document,
  ) {}

  ngOnInit(): void {
    this.dashboardStore.entered();
    this.loadGroups();
  }

  protected trackByFn(index: number, group: WidgetGroup): string {
    return group.layout + group.slots.map((slot) => slot?.type).join();
  }

  protected onConfigure(): void {
    this.updateIsEditingState(true);
  }

  @HostListener('document:keydown.escape')
  protected onCancelConfigure(): void {
    this.updateIsEditingState(false);
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
        this.updateIsEditingState(false);
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

  private updateIsEditingState(value: boolean): void {
    this.isEditing.set(value);
    this.updateElementsAvailability();
  }

  private updateElementsAvailability(): void {
    const groupElements = this.document.querySelectorAll('.group *');
    groupElements.forEach((element) => {
      if (element instanceof HTMLButtonElement || element instanceof HTMLAnchorElement) {
        if (this.isEditing()) {
          element.setAttribute('tabindex', '-1');
          element.style.pointerEvents = 'none';
        } else {
          element.removeAttribute('tabindex');
          element.style.pointerEvents = 'auto';
        }
      }
    });
  }
}
