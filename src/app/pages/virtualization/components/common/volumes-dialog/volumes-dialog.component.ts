import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, computed, Inject, OnInit, signal,
} from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogContent, MatDialogRef, MatDialogTitle,
} from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { parseISO } from 'date-fns';
import { filter, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Role } from 'app/enums/role.enum';
import { VirtualizationVolume } from 'app/interfaces/virtualization.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import {
  actionsColumn,
} from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import {
  buttonColumn,
} from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-button/ix-cell-button.component';
import { dateColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-date/ix-cell-date.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { createTable } from 'app/modules/ix-table/utils';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  UploadIsoButtonComponent,
} from 'app/pages/virtualization/components/common/volumes-dialog/upload-iso-button/upload-iso-button.component';
import { ErrorHandlerService } from 'app/services/error-handler.service';

export interface VolumesDialogOptions {
  selectionMode: boolean;
}

@UntilDestroy()
@Component({
  selector: 'ix-volumes-dialog',
  templateUrl: './volumes-dialog.component.html',
  styleUrls: ['./volumes-dialog.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogTitle,
    TranslateModule,
    MatIconButton,
    TestDirective,
    IxIconComponent,
    MatDialogContent,
    AsyncPipe,
    IxTableBodyComponent,
    IxTableComponent,
    IxTableHeadComponent,
    IxTableEmptyDirective,
    UploadIsoButtonComponent,
    FakeProgressBarComponent,
  ],
})
export class VolumesDialogComponent implements OnInit {
  private options = signal<VolumesDialogOptions>({ selectionMode: false });

  protected requiredRoles = [Role.VirtImageWrite];

  protected columns = computed(() => {
    const selectionMode = this.options().selectionMode;

    return createTable<VirtualizationVolume>([
      textColumn({
        title: this.translate.instant('Name'),
        propertyName: 'name',
      }),
      dateColumn({
        title: this.translate.instant('Created At'),
        propertyName: 'created_at',
        getValue: (row) => parseISO(row.created_at),
      }),
      dateColumn({
        title: this.translate.instant('Used By'),
        propertyName: 'used_by',
        getValue: (row) => {
          if (!row.used_by) {
            return this.translate.instant('Not used');
          }
          return row.used_by.join(', ');
        },
      }),
      buttonColumn({
        text: this.translate.instant('Select'),
        hidden: !selectionMode,
        cssClass: 'select-cell',
        onClick: (row) => this.dialogRef.close(row),
      }),
      actionsColumn({
        hidden: selectionMode,
        actions: [
          {
            iconName: iconMarker('mdi-delete'),
            tooltip: this.translate.instant('Delete'),
            requiredRoles: this.requiredRoles,
            onClick: (row) => this.onDelete(row),
            disabled: (row) => of(row.used_by.length > 0),
            dynamicTooltip: (row) => {
              if (row.used_by.length > 0) {
                return of(this.translate.instant('Volume is in use.'));
              }
              return of('');
            },
          },
        ],
      }),
    ], {
      uniqueRowTag: (row) => 'volume' + row.id,
      ariaLabels: (row) => [row.id, this.translate.instant('Volume')],
    });
  });

  protected dataProvider = new AsyncDataProvider(
    this.api.call('virt.volume.query'),
  );

  constructor(
    private api: ApiService,
    private dialog: DialogService,
    private errorHandler: ErrorHandlerService,
    private loader: AppLoaderService,
    private snackbar: SnackbarService,
    private translate: TranslateService,
    protected emptyService: EmptyService,
    protected dialogRef: MatDialogRef<VolumesDialogComponent, VirtualizationVolume | null>,
    @Inject(MAT_DIALOG_DATA) options: VolumesDialogOptions,
  ) {
    this.options.set(options || { selectionMode: false });
  }

  ngOnInit(): void {
    this.dataProvider.load();
  }

  protected onDelete(volume: VirtualizationVolume): void {
    this.dialog.confirm({
      title: this.translate.instant('Delete volume'),
      message: this.translate.instant('Are you sure you want to delete volume {name}?', { name: volume.name }),
    })
      .pipe(
        filter(Boolean),
        switchMap(() => {
          return this.api.call('virt.volume.delete', [volume.id]).pipe(
            this.loader.withLoader(),
            this.errorHandler.catchError(),
          );
        }),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('Volume removed'));
        this.dataProvider.load();
      });
  }

  protected onImageUploaded(): void {
    this.dataProvider.load();
  }
}
