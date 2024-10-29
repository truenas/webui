import { AsyncPipe } from '@angular/common';
import {
  Component, OnInit, ChangeDetectionStrategy,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  filter, map, take, tap,
} from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { ContainerImage } from 'app/interfaces/container-image.interface';
import { EmptyService } from 'app/modules/empty/empty.service';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { actionsColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { checkboxColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-checkbox/ix-cell-checkbox.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTablePagerComponent } from 'app/modules/ix-table/components/ix-table-pager/ix-table-pager.component';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { createTable } from 'app/modules/ix-table/utils';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { DockerImageDeleteDialogComponent } from 'app/pages/apps/components/docker-images/docker-image-delete-dialog/docker-image-delete-dialog.component';
import { dockerImagesListElements } from 'app/pages/apps/components/docker-images/docker-images-list/docker-images-list.elements';
import { PullImageFormComponent } from 'app/pages/apps/components/docker-images/pull-image-form/pull-image-form.component';
import { SlideInService } from 'app/services/slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

// TODO: Exclude AnythingUi when NAS-127632 is done
export interface ContainerImageUi extends ContainerImage {
  selected: boolean;
}

@UntilDestroy()
@Component({
  selector: 'ix-docker-images-list',
  templateUrl: './docker-images-list.component.html',
  styleUrls: ['./docker-images-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [FileSizePipe],
  standalone: true,
  imports: [
    TranslateModule,
    FileSizePipe,
    PageHeaderComponent,
    SearchInput1Component,
    MatButton,
    RequiresRolesDirective,
    TestDirective,
    IxTableComponent,
    IxTableEmptyDirective,
    IxTableHeadComponent,
    IxIconComponent,
    AsyncPipe,
    IxTableBodyComponent,
    IxTablePagerComponent,
  ],
})
export class DockerImagesListComponent implements OnInit {
  protected readonly requiredRoles = [Role.AppsWrite];
  protected readonly searchableElements = dockerImagesListElements;

  dataProvider: AsyncDataProvider<ContainerImageUi>;
  containerImages: ContainerImageUi[] = [];
  filterString = '';
  columns = createTable<ContainerImageUi>([
    checkboxColumn({
      propertyName: 'selected',
      onRowCheck: (row, checked) => {
        this.containerImages.find((image) => row.id === image.id).selected = checked;
        this.dataProvider.setRows([]);
        this.onListFiltered(this.filterString);
      },
      onColumnCheck: (checked) => {
        this.dataProvider.currentPage$.pipe(
          take(1),
          untilDestroyed(this),
        ).subscribe((images) => {
          images.forEach((image) => image.selected = checked);
          this.dataProvider.setRows([]);
          this.onListFiltered(this.filterString);
        });
      },
      cssClass: 'checkboxs-column',
    }),
    textColumn({
      title: this.translate.instant('Image ID'),
      propertyName: 'id',
    }),
    textColumn({
      title: this.translate.instant('Tags'),
      propertyName: 'repo_tags',
      getValue: (row) => row.repo_tags.join(', '),
    }),
    textColumn({
      title: this.translate.instant('Image Size'),
      propertyName: 'size',
      getValue: (row) => {
        return row.size
          ? this.fileSizePipe.transform(row.size)
          : this.translate.instant('Unknown');
      },
    }),
    actionsColumn({
      actions: [
        {
          iconName: iconMarker('mdi-delete'),
          tooltip: this.translate.instant('Delete'),
          requiredRoles: this.requiredRoles,
          onClick: (row) => this.doDelete([row]),
        },
      ],
    }),
  ], {
    uniqueRowTag: (row) => 'container-image-' + row.id,
    ariaLabels: (row) => [row.id, this.translate.instant('Docker Image')],
  });

  get selectedImages(): ContainerImageUi[] {
    return this.containerImages.filter((image) => image.selected);
  }

  constructor(
    public emptyService: EmptyService,
    public formatter: IxFormatterService,
    private ws: WebSocketService,
    private matDialog: MatDialog,
    private slideInService: SlideInService,
    private translate: TranslateService,
    private fileSizePipe: FileSizePipe,
  ) {
  }

  ngOnInit(): void {
    const containerImages$ = this.ws.call('app.image.query').pipe(
      map((images) => images.map((image) => ({ ...image, selected: false }))),
      tap((images) => this.containerImages = images),
    );
    this.dataProvider = new AsyncDataProvider(containerImages$);
    this.refresh();
    this.dataProvider.emptyType$.pipe(untilDestroyed(this)).subscribe(() => {
      this.onListFiltered(this.filterString);
    });
  }

  doAdd(): void {
    const slideInRef = this.slideInService.open(PullImageFormComponent);
    slideInRef.slideInClosed$
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => this.refresh());
  }

  doDelete(images: ContainerImageUi[]): void {
    this.matDialog.open(DockerImageDeleteDialogComponent, { data: this.prepareImages(images) })
      .afterClosed()
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => this.refresh());
  }

  protected onListFiltered(query: string): void {
    this.filterString = query.toLowerCase();
    this.dataProvider.setFilter({
      query,
      columnKeys: ['repo_tags'],
      // eslint-disable-next-line @typescript-eslint/naming-convention
      preprocessMap: { repo_tags: (tags: string[]) => tags.join(', ') },
    });
  }

  private refresh(): void {
    this.dataProvider.load();
  }

  private prepareImages(images: ContainerImageUi[]): ContainerImage[] {
    return images.map((image) => {
      delete image.selected;
      return image as ContainerImage;
    });
  }
}
