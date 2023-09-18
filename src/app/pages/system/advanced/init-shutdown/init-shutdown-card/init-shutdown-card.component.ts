import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { switchMap, from, filter } from 'rxjs';
import { InitShutdownScript } from 'app/interfaces/init-shutdown-script.interface';
import { ArrayDataProvider } from 'app/modules/ix-table2/array-data-provider';
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import {
  yesNoColumn,
} from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-yesno/ix-cell-yesno.component';
import { createTable } from 'app/modules/ix-table2/utils';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { AdvancedSettingsService } from 'app/pages/system/advanced/advanced-settings.service';
import {
  InitShutdownFormComponent,
} from 'app/pages/system/advanced/init-shutdown/init-shutdown-form/init-shutdown-form.component';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';



@UntilDestroy()
@Component({
  selector: 'ix-init-shutdown-card',
  templateUrl: './init-shutdown-card.component.html',
  styleUrls: ['./init-shutdown-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InitShutdownCardComponent implements OnInit {
  dataProvider = new ArrayDataProvider<InitShutdownScript>();

  columns = createTable<InitShutdownScript>([
    textColumn({
      title: this.translate.instant('Command / Script'),
      propertyName: 'command',
    }),
    textColumn({
      title: this.translate.instant('Description'),
      propertyName: 'comment',
    }),
    textColumn({
      title: this.translate.instant('When'),
      propertyName: 'when',
    }),
    yesNoColumn({
      title: this.translate.instant('Enabled'),
      propertyName: 'enabled',
    }),
    textColumn({
      title: this.translate.instant('Timeout'),
      propertyName: 'timeout',
    }),
    textColumn({
      propertyName: 'id',
    }),
  ]);

  isLoading = false;

  constructor(
    private slideInService: IxSlideInService,
    private translate: TranslateService,
    private errorHandler: ErrorHandlerService,
    private ws: WebSocketService,
    private dialog: DialogService,
    private cdr: ChangeDetectorRef,
    private snackbar: SnackbarService,
    private advancedSettings: AdvancedSettingsService,
  ) {}

  ngOnInit(): void {
    this.loadScripts();
  }

  onAdd(): void {
    this.openForm();
  }

  loadScripts(): void {
    this.isLoading = true;
    this.ws.call('initshutdownscript.query')
      .pipe(this.errorHandler.catchError(), untilDestroyed(this))
      .subscribe((scripts) => {
        this.dataProvider.setRows(scripts);
        this.isLoading = false;
        this.cdr.markForCheck();
      });
  }

  onDelete(row: InitShutdownScript): void {
    this.dialog.confirm({
      title: this.translate.instant('Delete Script'),
      message: this.translate.instant('Delete Init/Shutdown Script {script}?', {
        script: row.command,
      }),
      buttonText: this.translate.instant('Delete'),
    })
      .pipe(
        switchMap(() => this.ws.call('initshutdownscript.delete', [row.id])),
        filter(Boolean),
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('Script deleted.'));
        this.loadScripts();
      });
  }

  onEdit(row: InitShutdownScript): void {
    this.openForm(row);
  }

  private openForm(row?: InitShutdownScript): void {
    from(this.advancedSettings.showFirstTimeWarningIfNeeded()).pipe(
      switchMap(() => this.slideInService.open(InitShutdownFormComponent, { data: row }).slideInClosed$),
      filter(Boolean),
      untilDestroyed(this),
    )
      .subscribe(() => {
        this.loadScripts();
      });
  }
}
