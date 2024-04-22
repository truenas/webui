import {
  animate, group as groupAnimations, style, transition, trigger,
} from '@angular/animations';
import { moveItemInArray } from '@angular/cdk/drag-drop';
import {
  ChangeDetectionStrategy, Component, OnInit, signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { WidgetGroupFormComponent } from 'app/pages/dashboard/components/widget-group-form/widget-group-form.component';
import { DashboardStore } from 'app/pages/dashboard/services/dashboard.store';
import { WidgetGroup, WidgetGroupLayout } from 'app/pages/dashboard/types/widget-group.interface';
import { IxChainedSlideInService } from 'app/services/ix-chained-slide-in.service';

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
  readonly renderedGroups = signal<WidgetGroup[]>([]);
  readonly savedGroups = toSignal(this.dashboardStore.groups$);

  readonly isEditing = signal(false);

  // TODO: Use similar approach to loading as we have on Datasets
  // TODO: If old data is available, show it while loading new data.
  // TODO: Prevent user from entering configuration mode while loading.
  readonly isLoading = toSignal(this.dashboardStore.isLoading$);

  constructor(
    private dashboardStore: DashboardStore,
    private slideIn: IxChainedSlideInService,
  ) {}

  ngOnInit(): void {
    this.dashboardStore.entered();
    this.loadGroups();
  }

  // TODO: Enter configuration mode. Probably store layout that is being edited in a new service.
  protected onConfigure(): void {
    this.isEditing.set(true);
  }

  protected onCancelConfigure(): void {
    this.isEditing.set(false);
    this.renderedGroups.set(this.savedGroups());
  }

  protected onAddGroup(): void {
    const newGroup: WidgetGroup = {
      layout: WidgetGroupLayout.Full,
      slots: [],
    };

    this.renderedGroups.update((groups) => [...groups, newGroup]);
    this.onEditGroup(newGroup);
  }

  protected onEditGroup(group: WidgetGroup): void {
    this.slideIn
      .open(WidgetGroupFormComponent, true, group)
      .pipe(untilDestroyed(this))
      .subscribe(() => {

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

  // TODO: Filter out fully empty groups somewhere.
  protected onSave(): void {
    this.dashboardStore
      .save(this.renderedGroups())
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.isEditing.set(false);
        // TODO: Handle errors.
      });
  }

  private loadGroups(): void {
    this.dashboardStore
      .groups$
      .pipe(untilDestroyed(this))
      .subscribe((groups) => {
        if (this.isEditing()) {
          return;
        }

        this.renderedGroups.set(groups);
      });
  }
}
