import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  tnIconMarker,
  TnButtonComponent,
  TnCardComponent,
  TnCardFooterActionsDirective,
  TnCellDefDirective,
  TnEmptyComponent,
  TnHeaderCellDefDirective,
  TnTableColumnDirective,
  TnTableComponent,
} from '@truenas/ui-components';
import { take } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { InitShutdownScript } from 'app/interfaces/init-shutdown-script.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IconActionConfig } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/icon-action-config.interface';
import { YesNoPipe } from 'app/modules/pipes/yes-no/yes-no.pipe';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import {
  TableActionsCellComponent,
} from 'app/modules/tn-table-cells/actions-cell/table-actions-cell.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { initShutdownCardElements } from 'app/pages/system/advanced/init-shutdown/init-shutdown-card/init-shutdown-card.elements';
import {
  InitShutdownFormComponent,
} from 'app/pages/system/advanced/init-shutdown/init-shutdown-form/init-shutdown-form.component';
import { FirstTimeWarningService } from 'app/services/first-time-warning.service';

@Component({
  selector: 'ix-init-shutdown-card',
  templateUrl: './init-shutdown-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TnCardFooterActionsDirective,
    RequiresRolesDirective,
    TnButtonComponent,
    UiSearchDirective,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    TnEmptyComponent,
    TableActionsCellComponent,
    TranslateModule,
    AsyncPipe,
    YesNoPipe,
  ],
})
export class InitShutdownCardComponent implements OnInit {
  private translate = inject(TranslateService);
  private api = inject(ApiService);
  private dialog = inject(DialogService);
  private firstTimeWarning = inject(FirstTimeWarningService);
  protected emptyService = inject(EmptyService);
  private formPanel = inject(FormSidePanelService);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.SystemCronWrite];
  protected readonly searchableElements = initShutdownCardElements;

  dataProvider: AsyncDataProvider<InitShutdownScript>;

  protected readonly displayedColumns = ['command', 'comment', 'when', 'enabled', 'timeout', 'actions'];

  protected readonly trackBy = (_: number, row: InitShutdownScript): number => row.id;

  protected readonly actions: IconActionConfig<InitShutdownScript>[] = [
    {
      iconName: tnIconMarker('pencil', 'mdi'),
      tooltip: this.translate.instant('Edit'),
      onClick: (row) => this.onEdit(row),
    },
    {
      iconName: tnIconMarker('delete', 'mdi'),
      tooltip: this.translate.instant('Delete'),
      onClick: (row) => this.onDelete(row),
      requiredRoles: this.requiredRoles,
    },
  ];

  protected uniqueRowTag(row: InitShutdownScript): string {
    return `card-init-shutdown-${row.command}-${row.when}`;
  }

  protected ariaLabel(row: InitShutdownScript): string {
    return [row.command, this.translate.instant('Init/Shutdown Script')].join(' ');
  }

  ngOnInit(): void {
    this.loadScripts();
  }

  onAdd(): void {
    this.firstTimeWarning.showFirstTimeWarningIfNeeded().pipe(
      take(1),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.formPanel.open(InitShutdownFormComponent, {
        title: this.translate.instant('Add Init/Shutdown Script'),
      }).onSuccess(() => this.loadScripts(), this.destroyRef);
    });
  }

  private loadScripts(): void {
    if (!this.dataProvider) {
      const scripts$ = this.api.call('initshutdownscript.query').pipe(takeUntilDestroyed(this.destroyRef));
      this.dataProvider = new AsyncDataProvider<InitShutdownScript>(scripts$);
    }
    this.dataProvider.load();
  }

  onDelete(row: InitShutdownScript): void {
    this.dialog.confirmDelete({
      title: this.translate.instant('Delete Script'),
      message: this.translate.instant('Delete Init/Shutdown Script {script}?', {
        script: row.command,
      }),
      call: () => this.api.call('initshutdownscript.delete', [row.id]),
      successMessage: this.translate.instant('Script deleted.'),
    })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.loadScripts();
      });
  }

  onEdit(row: InitShutdownScript): void {
    this.firstTimeWarning.showFirstTimeWarningIfNeeded().pipe(
      take(1),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.formPanel.open(InitShutdownFormComponent, {
        title: this.translate.instant('Edit Init/Shutdown Script'),
        inputs: { editScript: row },
      }).onSuccess(() => this.loadScripts(), this.destroyRef);
    });
  }
}
