import {
  Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, AfterViewInit, TemplateRef,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import {
  delay, filter, map,
} from 'rxjs/operators';
import { ContainerImage } from 'app/interfaces/container-image.interface';
import { EmptyConfig, EmptyType } from 'app/modules/entity/entity-empty/entity-empty.component';
import { IxFormatterService } from 'app/modules/ix-forms/services/ix-formatter.service';
import { IxCheckboxColumnComponent } from 'app/modules/ix-tables/components/ix-checkbox-column/ix-checkbox-column.component';
import { DockerImageDeleteDialogComponent } from 'app/pages/applications/docker-images/docker-image-delete-dialog/docker-image-delete-dialog.component';
import { DockerImageUpdateDialogComponent } from 'app/pages/applications/docker-images/docker-image-update-dialog/docker-image-update-dialog.component';
import { DockerImagesComponentStore } from 'app/pages/applications/docker-images/docker-images.store';
import { PullImageFormComponent } from 'app/pages/applications/docker-images/pull-image-form/pull-image-form.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { LayoutService } from 'app/services/layout.service';

@UntilDestroy()
@Component({
  selector: 'ix-docker-images-list',
  templateUrl: './docker-images-list.component.html',
  styleUrls: ['./docker-images-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DockerImagesListComponent implements OnInit, AfterViewInit {
  @ViewChild('pageHeader') pageHeader: TemplateRef<unknown>;
  dataSource: MatTableDataSource<ContainerImage> = new MatTableDataSource([]);
  displayedColumns = ['select', 'id', 'repo_tags', 'created', 'size', 'update', 'actions'];
  @ViewChild(MatSort, { static: false }) sort: MatSort;
  @ViewChild(IxCheckboxColumnComponent, { static: false }) checkboxColumn: IxCheckboxColumnComponent<ContainerImage>;
  defaultSort: Sort = { active: 'created', direction: 'desc' };
  filterString = '';
  loadingConfig: EmptyConfig = {
    type: EmptyType.Loading,
    large: false,
    title: this.translate.instant('Loading...'),
  };
  isLoading$ = this.store.isLoading$;
  emptyOrErrorConfig$: Observable<EmptyConfig> = this.store.isError$.pipe(
    map((hasError) => {
      if (hasError) {
        return {
          type: EmptyType.Errors,
          large: true,
          title: this.translate.instant('Docker Images could not be loaded'),
        };
      }

      return {
        type: EmptyType.NoPageData,
        title: this.translate.instant('No Docker Images are available'),
        large: true,
      };
    }),
  );

  get selectionHasUpdates(): boolean {
    return this.checkboxColumn.selection.selected.some((image) => image.update_available);
  }

  constructor(
    public formatter: IxFormatterService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    private matDialog: MatDialog,
    private slideInService: IxSlideInService,
    private store: DockerImagesComponentStore,
    private layoutService: LayoutService,
  ) {
  }

  ngOnInit(): void {
    this.getDockerImages();
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.layoutService.pageHeaderUpdater$.next(this.pageHeader);
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
