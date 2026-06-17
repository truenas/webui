import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal, viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnDialog, TnTablePagerComponent,
  TnButtonComponent, TnCellDefDirective, TnHeaderCellDefDirective, TnIconButtonComponent,
  TnSortEvent, TnTableColumnDirective, TnTableComponent } from '@truenas/ui-components';
import { filter, take } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { ContainerImage, ContainerImageUi } from 'app/interfaces/container-image.interface';
import { EmptyService } from 'app/modules/empty/empty.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { mapTnSortToProviderSorting } from 'app/modules/ix-table/utils';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { ApiService } from 'app/modules/websocket/api.service';
import { DockerImageDeleteDialog } from 'app/pages/apps/components/docker-images/docker-image-delete-dialog/docker-image-delete-dialog.component';
import { dockerImagesListElements } from 'app/pages/apps/components/docker-images/docker-images-list/docker-images-list.elements';
import { PullImageFormComponent } from 'app/pages/apps/components/docker-images/pull-image-form/pull-image-form.component';

@Component({
  selector: 'ix-docker-images-list',
  templateUrl: './docker-images-list.component.html',
  styleUrls: ['./docker-images-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    PageHeaderComponent,
    BasicSearchComponent,
    TnButtonComponent,
    RequiresRolesDirective,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    TnIconButtonComponent,
    TnTablePagerComponent,
    FileSizePipe,
    AsyncPipe,
  ],
})
export class DockerImagesListComponent implements OnInit {
  protected emptyService = inject(EmptyService);
  private api = inject(ApiService);
  private tnDialog = inject(TnDialog);
  private slideIn = inject(SlideIn);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.AppsWrite];
  protected readonly searchableElements = dockerImagesListElements;

  dataProvider: AsyncDataProvider<ContainerImage>;
  searchQuery = signal('');
  protected selectedImages = signal<ContainerImage[]>([]);

  protected readonly displayedColumns = ['id', 'repo_tags', 'size', 'actions'];

  private readonly tnTable = viewChild(TnTableComponent);

  ngOnInit(): void {
    this.dataProvider = new AsyncDataProvider(this.api.call('app.image.query'));
    this.refresh();
    this.dataProvider.emptyType$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.onListFiltered(this.searchQuery());
    });
  }

  doAdd(): void {
    this.slideIn.open(PullImageFormComponent)
      .onSuccess(() => this.refresh(), this.destroyRef);
  }

  doDelete(images: ContainerImageUi[]): void {
    this.tnDialog.open(DockerImageDeleteDialog, { data: this.prepareImages(images) })
      .closed
      .pipe(filter(Boolean), take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refresh());
  }

  protected onListFiltered(query: string): void {
    this.searchQuery.set(query);
    this.dataProvider.setFilter({
      query,
      columnKeys: ['repo_tags'],
      // eslint-disable-next-line @typescript-eslint/naming-convention
      preprocessMap: { repo_tags: (tags: string[]) => tags.join(', ') },
    });
  }

  protected onSelectionChange(images: ContainerImage[]): void {
    this.selectedImages.set(images);
  }

  protected onSortChange(event: TnSortEvent): void {
    this.dataProvider.setSorting(mapTnSortToProviderSorting<ContainerImage>(event));
  }

  private refresh(): void {
    this.tnTable()?.selection.clear();
    this.selectedImages.set([]);
    this.dataProvider.load();
  }

  private prepareImages(images: ContainerImageUi[]): ContainerImage[] {
    return images.map((image) => {
      delete image.selected;
      return image as ContainerImage;
    });
  }
}
