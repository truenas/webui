import { SelectionModel } from '@angular/cdk/collections';
import {
  Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter, tap } from 'rxjs/operators';
import { Role } from 'app/enums/role.enum';
import { ContainerImage } from 'app/interfaces/container-image.interface';
import { EmptyService } from 'app/modules/empty/empty.service';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { actionsColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { createTable } from 'app/modules/ix-table/utils';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { DockerImageDeleteDialogComponent } from 'app/pages/apps/components/docker-images/docker-image-delete-dialog/docker-image-delete-dialog.component';
import { PullImageFormComponent } from 'app/pages/apps/components/docker-images/pull-image-form/pull-image-form.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-docker-images-list',
  templateUrl: './docker-images-list.component.html',
  styleUrls: ['./docker-images-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [FileSizePipe],
})
export class DockerImagesListComponent implements OnInit {
  protected readonly requiredRoles = [Role.AppsWrite];
  // TODO: https://ixsystems.atlassian.net/browse/NAS-130379
  // protected readonly searchableElements = dockerImagesListElements;

  dataProvider: AsyncDataProvider<ContainerImage>;
  containerImages: ContainerImage[] = [];
  selection = new SelectionModel<ContainerImage>(true, []);
  filterString = '';
  columns = createTable<ContainerImage>([
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
          iconName: 'delete',
          tooltip: this.translate.instant('Delete'),
          requiredRoles: this.requiredRoles,
          onClick: (row) => this.doDelete([row]),
        },
      ],
    }),
  ], {
    rowTestId: (row) => 'container-image-' + row.id,
    ariaLabels: (row) => [row.id, this.translate.instant('Docker Image')],
  });

  constructor(
    public emptyService: EmptyService,
    public formatter: IxFormatterService,
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private matDialog: MatDialog,
    private slideInService: IxSlideInService,
    private translate: TranslateService,
    private fileSizePipe: FileSizePipe,
  ) {
  }

  ngOnInit(): void {
    const containerImages$ = this.ws.call('app.image.query').pipe(
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

  doDelete(images: ContainerImage[]): void {
    this.matDialog.open(DockerImageDeleteDialogComponent, { data: images })
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
}
