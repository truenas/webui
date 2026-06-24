import { SelectionModel } from '@angular/cdk/collections';
import {
  Component, ChangeDetectionStrategy,
  computed, inject,
  output,
  signal,
  DestroyRef,
} from '@angular/core';
import { toObservable, toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { TnCheckboxComponent, TnEmptyComponent } from '@truenas/ui-components';
import { distinctUntilChanged, map, tap } from 'rxjs';
import { WINDOW } from 'app/helpers/window.helper';
import { Container } from 'app/interfaces/container.interface';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { UiSearchDirectivesService } from 'app/modules/global-search/services/ui-search-directives.service';
import { LayoutService } from 'app/modules/layout/layout.service';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { ContainerListBulkActionsComponent } from 'app/pages/containers/components/all-containers/container-list/container-list-bulk-actions/container-list-bulk-actions.component';
import { ContainerRowComponent } from 'app/pages/containers/components/all-containers/container-list/container-row/container-row.component';
import { ContainersStore } from 'app/pages/containers/stores/containers.store';

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
    TnCheckboxComponent,
    TnEmptyComponent,
    ContainerListBulkActionsComponent,
  ],
})

export class ContainerListComponent {
  private destroyRef = inject(DestroyRef);
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
  protected get isAllSelected(): boolean {
    return this.selection.selected.length === this.filteredContainers().length;
  }

  protected get checkedContainers(): Container[] {
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

  constructor() {
    toObservable(this.containerId).pipe(
      distinctUntilChanged(),
      tap((containerId) => {
        if (containerId !== null) {
          this.containersStore.selectContainer(containerId);
        }
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();

    setTimeout(() => {
      this.handlePendingGlobalSearchElement();
    });
  }

  protected toggleAllChecked(checked: boolean): void {
    if (checked) {
      this.filteredContainers().forEach((container) => this.selection.select(container.id));
    } else {
      this.selection.clear();
    }
  }

  protected navigateToDetails(container: Container): void {
    this.layoutService.navigatePreservingScroll(this.router, ['/containers', 'view', container.id]);

    this.toggleShowMobileDetails.emit(true);
  }

  protected resetSelection(): void {
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
