import {
  Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, AfterViewInit,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { combineLatest, Observable, of } from 'rxjs';
import {
  delay, filter, map, switchMap,
} from 'rxjs/operators';
import { EmptyType } from 'app/enums/empty-type.enum';
import { ContainerImage } from 'app/interfaces/container-image.interface';
import { IxFormatterService } from 'app/modules/ix-forms/services/ix-formatter.service';
import { IxCheckboxColumnComponent } from 'app/modules/ix-tables/components/ix-checkbox-column/ix-checkbox-column.component';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';
import { DockerImageDeleteDialogComponent } from 'app/pages/apps/components/docker-images/docker-image-delete-dialog/docker-image-delete-dialog.component';
import { DockerImageUpdateDialogComponent } from 'app/pages/apps/components/docker-images/docker-image-update-dialog/docker-image-update-dialog.component';
import { DockerImagesComponentStore } from 'app/pages/apps/components/docker-images/docker-images.store';
import { PullImageFormComponent } from 'app/pages/apps/components/docker-images/pull-image-form/pull-image-form.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  selector: 'ix-docker-images-list',
  templateUrl: './docker-images-list.component.html',
  styleUrls: ['./docker-images-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DockerImagesListComponent implements OnInit, AfterViewInit {
  dataSource = new MatTableDataSource<ContainerImage>([]);

  displayedColumns = ['select', 'id', 'repo_tags', 'size', 'update', 'actions'];

  @ViewChild(MatSort, { static: false }) sort: MatSort;
  @ViewChild(IxCheckboxColumnComponent, { static: false }) checkboxColumn: IxCheckboxColumnComponent<ContainerImage>;

  defaultSort: Sort = { active: 'repo_tags', direction: 'desc' };
  filterString = '';

  readonly EmptyType = EmptyType;
  isLoading$ = this.store.isLoading$;
  emptyType$: Observable<EmptyType> = combineLatest([
    this.isLoading$,
    this.store.isError$,
    this.store.entities$.pipe(
      map((images) => images.length === 0),
    ),
  ]).pipe(
    switchMap(([isLoading, isError, isNoData]) => {
      if (isLoading) {
        return of(EmptyType.Loading);
      }
      if (isError) {
        return of(EmptyType.Errors);
      }
      if (isNoData) {
        return of(EmptyType.NoPageData);
      }
      return of(EmptyType.NoSearchResults);
    }),
  );

  get selectionHasUpdates(): boolean {
    return this.checkboxColumn.selection.selected.some((image) => image.update_available);
  }

  get emptyConfigService(): EmptyService {
    return this.emptyService;
  }

  constructor(
    public formatter: IxFormatterService,
    private cdr: ChangeDetectorRef,
    private matDialog: MatDialog,
    private slideInService: IxSlideInService,
    private store: DockerImagesComponentStore,
    private emptyService: EmptyService,
  ) {
  }

  ngOnInit(): void {
    this.store.loadEntities();
    this.getDockerImages();
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
  }

  onSearch(query: string): void {
    this.dataSource.filter = query;
  }

  doAdd(): void {
    this.slideInService.open(PullImageFormComponent);
  }

  doDelete(images: ContainerImage[]): void {
    this.matDialog.open(DockerImageDeleteDialogComponent, {
      data: images,
    }).afterClosed().pipe(
      filter(Boolean),
      delay(50),
      untilDestroyed(this),
    ).subscribe(() => {
      this.checkboxColumn.clearSelection();
      this.cdr.markForCheck();
    });
  }

  doUpdate(images: ContainerImage[]): void {
    this.matDialog.open(DockerImageUpdateDialogComponent, {
      data: images,
    }).afterClosed().pipe(
      filter(Boolean),
      delay(50),
      untilDestroyed(this),
    ).subscribe(() => {
      this.checkboxColumn.clearSelection();
      this.cdr.markForCheck();
    });
  }

  private createDataSource(images: ContainerImage[] = []): void {
    this.dataSource = new MatTableDataSource(images);
    this.dataSource.sort = this.sort;
    this.dataSource.filter = this.filterString;
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'id':
          return item.id;
        case 'repo_tags':
          return item.repo_tags.join();
        case 'size':
          return item.size;
        case 'update':
          return item.update_available ? 1 : 0;
        case 'created':
          return item.created?.$date ? item.created.$date.toString() : '';
        default:
          return undefined;
      }
    };
    this.store.patchState({ isLoading: false });
    this.cdr.markForCheck();
  }

  private getDockerImages(): void {
    this.store.patchState({ isLoading: true });
    this.store.entities$.pipe(
      untilDestroyed(this),
    ).subscribe({
      next: (images) => {
        this.createDataSource(images);
      },
      error: () => {
        this.createDataSource();
      },
    });
  }
}
