import { SelectionModel } from '@angular/cdk/collections';
import {
  Component, ChangeDetectionStrategy,
  computed, inject,
  output,
  signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { distinctUntilChanged, map, tap } from 'rxjs';
import { containersEmptyConfig, noSearchResultsConfig } from 'app/constants/empty-configs';
import { WINDOW } from 'app/helpers/window.helper';
import { ContainerInstance } from 'app/interfaces/container.interface';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { UiSearchDirectivesService } from 'app/modules/global-search/services/ui-search-directives.service';
import { LayoutService } from 'app/modules/layout/layout.service';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ContainerListBulkActionsComponent } from 'app/pages/containers/components/all-containers/container-list/container-list-bulk-actions/container-list-bulk-actions.component';
import { ContainerRowComponent } from 'app/pages/containers/components/all-containers/container-list/container-row/container-row.component';
import { ContainersStore } from 'app/pages/containers/stores/containers.store';

@UntilDestroy()
@Component({
  selector: 'ix-container-list',
  templateUrl: './container-list.component.html',
  styleUrls: ['./container-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    BasicSearchComponent,
    FakeProgressBarComponent,
    ContainerRowComponent,
    MatCheckboxModule,
    EmptyComponent,
    TestDirective,
    ContainerListBulkActionsComponent,
  ],
})

export class ContainerListComponent {
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private containersStore = inject(ContainersStore);
  private searchDirectives = inject(UiSearchDirectivesService);
  private layoutService = inject(LayoutService);

  readonly containerId = toSignal(this.activatedRoute.params.pipe(map((params) => +params['id'])));
  readonly toggleShowMobileDetails = output<boolean>();

  readonly searchQuery = signal<string>('');
  protected readonly window = inject<Window>(WINDOW);
  protected readonly selection = new SelectionModel<number>(true, []);

  protected readonly containers = this.containersStore.containers;
  protected readonly isLoading = this.containersStore.isLoading;

  protected readonly metrics = this.containersStore.metrics;

  protected readonly selectedContainer = this.containersStore.selectedContainer;
  get isAllSelected(): boolean {
    return this.selection.selected.length === this.filteredContainers().length;
  }

  get checkedContainers(): ContainerInstance[] {
    return this.selection.selected
      .map((id: number) => this.containers().find((container) => container.id === id))
      .filter((container) => !!container);
  }

  get hasCheckedContainers(): boolean {
    return this.checkedContainers.length > 0;
  }

  readonly isSelectedContainerVisible = computed(() => {
    return this.filteredContainers()?.some((container) => container.id === this.selectedContainer()?.id);
  });

  protected readonly filteredContainers = computed(() => {
    return (this.containers() || []).filter((container) => {
      return container?.name?.toLocaleLowerCase().includes(this.searchQuery().toLocaleLowerCase());
    });
  });

  protected readonly emptyConfig = computed<EmptyConfig>(() => {
    if (this.searchQuery()?.length && !this.filteredContainers()?.length) {
      return noSearchResultsConfig;
    }
    return containersEmptyConfig;
  });

  constructor() {
    toObservable(this.containerId).pipe(
      distinctUntilChanged(),
      tap((containerId) => {
        if (containerId !== null) {
          this.containersStore.selectContainer(containerId);
        }
      }),
      untilDestroyed(this),
    ).subscribe();

    setTimeout(() => {
      this.handlePendingGlobalSearchElement();
    });
  }

  toggleAllChecked(checked: boolean): void {
    if (checked) {
      this.filteredContainers().forEach((container) => this.selection.select(container.id));
    } else {
      this.selection.clear();
    }
  }

  navigateToDetails(container: ContainerInstance): void {
    this.layoutService.navigatePreservingScroll(this.router, ['/containers', 'view', container.id]);

    this.toggleShowMobileDetails.emit(true);
  }

  resetSelection(): void {
    this.selection.clear();
  }

  protected onListFiltered(query: string): void {
    this.searchQuery.set(query);
  }

  private handlePendingGlobalSearchElement(): void {
    const pendingHighlightElement = this.searchDirectives.pendingUiHighlightElement;

    if (pendingHighlightElement) {
      this.searchDirectives.get(pendingHighlightElement)?.highlight(pendingHighlightElement);
    }
  }
}
