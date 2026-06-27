import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal, viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  tnIconMarker,
  TnButtonComponent,
  TnCellDefDirective,
  TnEmptyComponent,
  TnHeaderCellDefDirective,
  TnSidePanelActionDirective,
  TnSidePanelComponent,
  TnTableColumnDirective,
  TnTableComponent,
  TnTablePagerComponent,
  type TnSortEvent,
} from '@truenas/ui-components';
import { Observable, of } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { InitShutdownScriptType, initShutdownScriptTypeLabels } from 'app/enums/init-shutdown-script-type.enum';
import { initShutdownScriptWhenLabels } from 'app/enums/init-shutdown-script-when.enum';
import { Role } from 'app/enums/role.enum';
import { InitShutdownScript } from 'app/interfaces/init-shutdown-script.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IconActionConfig } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/icon-action-config.interface';
import { mapTnSortToTableSort } from 'app/modules/ix-table/utils';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { YesNoPipe } from 'app/modules/pipes/yes-no/yes-no.pipe';
import {
  TableActionsCellComponent,
} from 'app/modules/tn-table-cells/actions-cell/table-actions-cell.component';
import { UnsavedChangesService } from 'app/modules/unsaved-changes/unsaved-changes.service';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  InitShutdownFormComponent,
} from 'app/pages/system/advanced/init-shutdown/init-shutdown-form/init-shutdown-form.component';
import { initShudownListElements } from 'app/pages/system/advanced/init-shutdown/init-shutdown-list/init-shutdown-list.elements';

@Component({
  selector: 'ix-init-shutdown-list',
  templateUrl: './init-shutdown-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    RequiresRolesDirective,
    UiSearchDirective,
    TnButtonComponent,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    TnEmptyComponent,
    TnSidePanelComponent,
    TnSidePanelActionDirective,
    TnTablePagerComponent,
    TableActionsCellComponent,
    InitShutdownFormComponent,
    TranslateModule,
    AsyncPipe,
    YesNoPipe,
  ],
})
export class InitShutdownListComponent implements OnInit {
  private translate = inject(TranslateService);
  private dialogService = inject(DialogService);
  private api = inject(ApiService);
  private unsavedChanges = inject(UnsavedChangesService);
  protected emptyService = inject(EmptyService);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.SystemCronWrite];
  protected readonly searchableElements = initShudownListElements;

  protected configOpen = signal(false);
  protected editingScript = signal<InitShutdownScript | undefined>(undefined);
  protected configForm = viewChild(InitShutdownFormComponent);

  protected readonly panelTitle = computed(() => (
    this.editingScript()
      ? this.translate.instant('Edit Init/Shutdown Script')
      : this.translate.instant('Add Init/Shutdown Script')
  ));

  dataProvider: AsyncDataProvider<InitShutdownScript>;

  protected readonly displayedColumns = ['type', 'comment', 'when', 'script', 'enabled', 'actions'];

  protected readonly trackByScriptId = (_: number, row: InitShutdownScript): number => row.id;

  protected readonly actions: IconActionConfig<InitShutdownScript>[] = [
    {
      iconName: tnIconMarker('pencil', 'mdi'),
      tooltip: this.translate.instant('Edit'),
      onClick: (row) => this.editScript(row),
    },
    {
      iconName: tnIconMarker('delete', 'mdi'),
      tooltip: this.translate.instant('Delete'),
      onClick: (row) => this.deleteScript(row),
      requiredRoles: this.requiredRoles,
    },
  ];

  protected uniqueRowTag(row: InitShutdownScript): string {
    return 'init-shutdown-' + row.command + '-' + row.type;
  }

  protected ariaLabel(row: InitShutdownScript): string {
    return [row.command, this.translate.instant('Init/Shutdown Script')].join(' ');
  }

  protected getScriptValue(row: InitShutdownScript): string {
    return row.type === InitShutdownScriptType.Command ? row.command : row.script;
  }

  protected getTypeLabel(row: InitShutdownScript): string {
    const typeLabel = initShutdownScriptTypeLabels.get(row.type) || row.type;
    return this.translate.instant(typeLabel);
  }

  protected getWhenLabel(row: InitShutdownScript): string {
    const whenLabel = initShutdownScriptWhenLabels.get(row.when) || row.when;
    return this.translate.instant(whenLabel);
  }

  protected readonly closeGuard = (): Observable<boolean> => {
    return this.configForm()?.hasUnsavedChanges()
      ? this.unsavedChanges.showConfirmDialog()
      : of(true);
  };

  protected onSortChange(event: TnSortEvent): void {
    this.dataProvider.setSorting(mapTnSortToTableSort<InitShutdownScript>(event, this.displayedColumns));
  }

  ngOnInit(): void {
    this.dataProvider = new AsyncDataProvider(this.api.call('initshutdownscript.query'));
    this.dataProvider.load();
  }

  protected addScript(): void {
    this.editingScript.set(undefined);
    this.configOpen.set(true);
  }

  private editScript(script: InitShutdownScript): void {
    this.editingScript.set(script);
    this.configOpen.set(true);
  }

  protected onConfigClosed(saved: boolean): void {
    this.configOpen.set(false);
    this.editingScript.set(undefined);
    if (saved) {
      this.dataProvider.load();
    }
  }

  private deleteScript(script: InitShutdownScript): void {
    this.dialogService.confirmDelete({
      title: this.translate.instant('Confirmation'),
      message: this.translate.instant('Are you sure you want to delete this script?'),
      call: () => this.api.call('initshutdownscript.delete', [script.id]),
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.dataProvider.load());
  }
}
