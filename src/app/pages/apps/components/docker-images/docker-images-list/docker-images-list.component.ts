import { SelectionModel } from '@angular/cdk/collections';
import {
  Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { filter, tap } from 'rxjs/operators';
import { Role } from 'app/enums/role.enum';
import { ContainerImage } from 'app/interfaces/container-image.interface';
import { IxFileSizePipe } from 'app/modules/ix-file-size/ix-file-size.pipe';
import { IxFormatterService } from 'app/modules/ix-forms/services/ix-formatter.service';
import { AsyncDataProvider } from 'app/modules/ix-table2/classes/async-data-provider/async-data-provider';
import { actionsColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { yesNoColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-yesno/ix-cell-yesno.component';
import { createTable } from 'app/modules/ix-table2/utils';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';
import { DockerImageDeleteDialogComponent } from 'app/pages/apps/components/docker-images/docker-image-delete-dialog/docker-image-delete-dialog.component';
import { DockerImageUpdateDialogComponent } from 'app/pages/apps/components/docker-images/docker-image-update-dialog/docker-image-update-dialog.component';
import { PullImageFormComponent } from 'app/pages/apps/components/docker-images/pull-image-form/pull-image-form.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-docker-images-list',
  templateUrl: './docker-images-list.component.html',
  styleUrls: ['./docker-images-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [IxFileSizePipe],
})
export class DockerImagesListComponent implements OnInit {
  protected readonly requiredRoles = [Role.AppsWrite];
  dataProvider: AsyncDataProvider<ContainerImage>;
  containerImages: ContainerImage[] = [];
  selection = new SelectionModel<ContainerImage>(true, []);
  filterString = '';
  columns = createTable<ContainerImage>([
    textColumn({
      title: this.translate.instant('Image ID'),
      propertyName: 'id',
      sortable: true,
    }),
    textColumn({
      title: this.translate.instant('Tags'),
      propertyName: 'repo_tags',
      sortable: true,
      getValue: (row) => row.repo_tags.join(', '),
    }),
    textColumn({
      title: this.translate.instant('Image Size'),
      propertyName: 'size',
      sortable: true,
      getValue: (row) => {
        return row.size
          ? this.fileSizePipe.transform(row.size)
          : this.translate.instant('Unknown');
      },
    }),
    yesNoColumn({
      title: this.translate.instant('Update available'),
      propertyName: 'update_available',
      sortBy: (row) => (row.update_available ? 1 : 0),
      sortable: true,
    }),
    actionsColumn({
      actions: [
        {
          iconName: 'update',
          tooltip: this.translate.instant('Update'),
          requiredRoles: this.requiredRoles,
          onClick: (row) => this.doUpdate([row]),
          hidden: (row) => of(!row.update_available),
        },
        {
          iconName: 'delete',
          tooltip: this.translate.instant('Delete'),
          requiredRoles: this.requiredRoles,
          onClick: (row) => this.doDelete([row]),
        },
      ],

    }),
  ], {
    rowTestId: (row) => 'container-image-' + row.id,
  });

  constructor(
    public emptyService: EmptyService,
    public formatter: IxFormatterService,
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private matDialog: MatDialog,
    private slideInService: IxSlideInService,
    private translate: TranslateService,
    private fileSizePipe: IxFileSizePipe,
  ) {
  }

  ngOnInit(): void {
    const containerImages$ = this.ws.call('container.image.query').pipe(
      tap((images) => this.containerImages = images),
    );
    this.dataProvider = new AsyncDataProvider(containerImages$);
    this.dataProvider.load();
  }

  doAdd(): void {
    const slideInRef = this.slideInService.open(PullImageFormComponent);
    slideInRef.slideInClosed$
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => this.dataProvider.load());
  }

  doDelete(images: ContainerImage[]): void {
    this.matDialog.open(DockerImageDeleteDialogComponent, { data: images })
      .afterClosed()
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => this.dataProvider.load());
  }

  doUpdate(images: ContainerImage[]): void {
    this.matDialog.open(DockerImageUpdateDialogComponent, { data: images })
      .afterClosed()
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => this.dataProvider.load());
  }

  protected onListFiltered(query: string): void {
    const filterString = query.toLowerCase();
    this.dataProvider.setRows(this.containerImages.filter((image) => {
      return image.repo_tags.join(', ').includes(filterString);
    }));
  }
}
