import { SelectionModel } from '@angular/cdk/collections';
import {
  Component, ChangeDetectionStrategy,
  signal, computed, inject,
  output,
  input,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { filter, switchMap } from 'rxjs';
import { EmptyType } from 'app/enums/empty-type.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import { VirtualizationInstance } from 'app/interfaces/virtualization.interface';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { InstanceListBulkActionsComponent } from 'app/pages/virtualization/components/all-instances/instance-list/instance-list-bulk-actions/instance-list-bulk-actions.component';
import { InstanceRowComponent } from 'app/pages/virtualization/components/all-instances/instance-list/instance-row/instance-row.component';
import { VirtualizationDevicesStore } from 'app/pages/virtualization/stores/virtualization-devices.store';
import { VirtualizationInstancesStore } from 'app/pages/virtualization/stores/virtualization-instances.store';

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
    InstanceListBulkActionsComponent,
  ],
})

export class InstanceListComponent {
  readonly isMobileView = input<boolean>();
  readonly toggleShowMobileDetails = output<boolean>();

  protected readonly searchQuery = signal<string>('');
  protected readonly window = inject<Window>(WINDOW);
  protected readonly selection = new SelectionModel<string>(true, []);

  protected readonly instances = this.store.instances;
  protected readonly isLoading = this.store.isLoading;

  protected readonly selectedInstance = this.deviceStore.selectedInstance;

  get isAllSelected(): boolean {
    return this.selection.selected.length === this.filteredInstances().length;
  }

  get checkedInstances(): VirtualizationInstance[] {
    return this.selection.selected.map((id) => this.instances().find((instance) => instance.id === id));
  }

  protected readonly filteredInstances = computed(() => {
    return (this.instances() || []).filter((instance) => {
      return instance?.name?.toLocaleLowerCase().includes(this.searchQuery().toLocaleLowerCase());
    });
  });

  protected readonly emptyConfig = computed<EmptyConfig>(() => {
    if (this.searchQuery()?.length && !this.filteredInstances()?.length) {
      return {
        type: EmptyType.NoSearchResults,
        title: this.translate.instant('No Search Results.'),
        message: this.translate.instant('No matching results found'),
        large: false,
      };
    }
    return {
      type: EmptyType.NoPageData,
      title: this.translate.instant('No instances'),
      message: this.translate.instant('Instances you create will automatically appear here.'),
      large: true,
    };
  });

  constructor(
    private store: VirtualizationInstancesStore,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private translate: TranslateService,
    private deviceStore: VirtualizationDevicesStore,
  ) {
    toObservable(this.instances).pipe(
      filter((instances) => !!instances?.length),
      switchMap(() => this.activatedRoute.params),
      untilDestroyed(this),
    ).subscribe((params) => {
      const instanceId = params.id as string;
      if (instanceId && this.instances().some((instance) => instance.id === instanceId)) {
        this.deviceStore.selectInstance(instanceId);
      } else {
        const [firstInstance] = this.instances();
        this.navigateToDetails(firstInstance);
      }
    });
  }

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
    this.deviceStore.selectInstance(instance.id);
    this.router.navigate(['/virtualization', 'view', instance.id]);

    if (this.isMobileView()) {
      this.toggleShowMobileDetails.emit(true);
    }
  }

  resetSelection(): void {
    this.selection.clear();
  }
}
