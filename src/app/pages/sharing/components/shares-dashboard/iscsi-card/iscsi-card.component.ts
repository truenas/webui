import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, effect, OnInit, signal, inject, viewChild, DestroyRef } from '@angular/core';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  tnIconMarker,
  TnButtonComponent,
  TnCardComponent,
  TnCardHeaderDirective,
  TnIconComponent,
  TnSidePanelActionDirective,
  TnSidePanelComponent,
  TnTooltipDirective,
  type TnCardAction,
  type TnCardHeaderStatus,
  type TnMenuItem,
} from '@truenas/ui-components';
import {
  filter, startWith, tap,
} from 'rxjs';
import { iscsiCardEmptyConfig } from 'app/constants/empty-configs';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { IscsiTargetMode, iscsiTargetModeNames } from 'app/enums/iscsi.enum';
import { Role } from 'app/enums/role.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { IscsiTarget } from 'app/interfaces/iscsi.interface';
import { CardAlertBadgeComponent } from 'app/modules/alerts/components/card-alert-badge/card-alert-badge.component';
import { AuthService } from 'app/modules/auth/auth.service';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { EmptyService } from 'app/modules/empty/empty.service';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { actionsWithMenuColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions-with-menu/ix-cell-actions-with-menu.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTablePagerShowMoreComponent } from 'app/modules/ix-table/components/ix-table-pager-show-more/ix-table-pager-show-more.component';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { createTable } from 'app/modules/ix-table/utils';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { iscsiCardElements } from 'app/pages/sharing/components/shares-dashboard/iscsi-card/iscsi-card.elements';
import {
  ServiceActionsMenuService,
} from 'app/pages/sharing/components/shares-dashboard/service-extra-actions/service-actions-menu.service';
import {
  GlobalTargetConfigurationComponent,
} from 'app/pages/sharing/iscsi/global-target-configuration/global-target-configuration.component';
import { IscsiWizardComponent } from 'app/pages/sharing/iscsi/iscsi-wizard/iscsi-wizard.component';
import { DeleteTargetDialog } from 'app/pages/sharing/iscsi/target/delete-target-dialog/delete-target-dialog.component';
import { TargetFormComponent } from 'app/pages/sharing/iscsi/target/target-form/target-form.component';
import { IscsiService } from 'app/services/iscsi.service';
import { LicenseService } from 'app/services/license.service';
import { ServicesState } from 'app/store/services/services.reducer';
import { selectService } from 'app/store/services/services.selectors';

@Component({
  selector: 'ix-iscsi-card',
  templateUrl: './iscsi-card.component.html',
  styleUrls: ['./iscsi-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnButtonComponent,
    TnCardComponent,
    TnCardHeaderDirective,
    TnSidePanelComponent,
    TnSidePanelActionDirective,
    TestDirective,
    TnIconComponent,
    TnTooltipDirective,
    UiSearchDirective,
    IxTableComponent,
    IxTableEmptyDirective,
    IxTableHeadComponent,
    IxTableBodyComponent,
    IxTablePagerShowMoreComponent,
    TranslateModule,
    AsyncPipe,
    RouterLink,
    EmptyComponent,
    CardAlertBadgeComponent,
    GlobalTargetConfigurationComponent,
  ],
})
export class IscsiCardComponent implements OnInit {
  private slideIn = inject(SlideIn);
  private translate = inject(TranslateService);
  private api = inject(ApiService);
  protected emptyService = inject(EmptyService);
  private store$ = inject<Store<ServicesState>>(Store);
  private matDialog = inject(MatDialog);
  private iscsiService = inject(IscsiService);
  private cdr = inject(ChangeDetectorRef);
  private license = inject(LicenseService);
  private destroyRef = inject(DestroyRef);
  private authService = inject(AuthService);
  private actionsMenu = inject(ServiceActionsMenuService);

  service$ = this.store$.select(selectService(ServiceName.Iscsi));
  private service = toSignal(this.service$);
  requiredRoles = [
    Role.SharingIscsiTargetWrite,
    Role.SharingIscsiWrite,
    Role.SharingWrite,
  ];

  private hasWriteRole = toSignal(this.authService.hasRole(this.requiredRoles), { initialValue: false });

  targets = signal<IscsiTarget[] | null>(null);

  protected readonly hasFibreChannel = toSignal(
    this.license.hasFibreChannel$.pipe(startWith(false)),
  );

  protected readonly searchableElements = iscsiCardElements;
  protected readonly emptyConfig = iscsiCardEmptyConfig;
  protected readonly cardMenuPath = ['sharing', 'iscsi'];

  protected serviceStatus = computed<TnCardHeaderStatus | undefined>(() => {
    const svc = this.service();
    if (!svc) {
      return undefined;
    }
    const label = this.translate.instant(this.titleCase(svc.state));
    switch (svc.state) {
      case ServiceStatus.Running:
        return { label, type: 'success' };
      case ServiceStatus.Stopped:
        return { label, type: 'neutral' };
      default:
        return { label, type: 'warning' };
    }
  });

  protected wizardAction = computed<TnCardAction | undefined>(() => {
    if (!this.hasWriteRole()) {
      return undefined;
    }
    return {
      label: this.translate.instant('Wizard'),
      handler: () => this.openForm(undefined, true),
    };
  });

  protected configOpen = signal(false);
  protected configForm = viewChild(GlobalTargetConfigurationComponent);

  protected serviceMenu = computed<TnMenuItem[] | undefined>(() => {
    const svc = this.service();
    if (!svc) {
      return undefined;
    }
    const localConfigItem: TnMenuItem = {
      id: 'service-config',
      label: this.translate.instant('Config Service'),
      action: () => this.configOpen.set(true),
    };
    return [
      this.actionsMenu.buildToggleItem(svc, this.hasWriteRole()),
      localConfigItem,
      this.actionsMenu.buildSessionsItem(svc),
      this.actionsMenu.buildLogsItem(svc),
    ].filter((item): item is TnMenuItem => item !== null);
  });

  protected onConfigClosed(): void {
    this.configOpen.set(false);
  }

  private titleCase(value: string): string {
    return value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : '';
  }

  dataProvider: AsyncDataProvider<IscsiTarget>;

  columns = createTable<IscsiTarget>([
    textColumn({
      title: this.translate.instant('Target Name'),
      propertyName: 'name',
    }),
    textColumn({
      title: this.translate.instant('Target Alias'),
      propertyName: 'alias',
    }),
    textColumn({
      title: this.translate.instant('Mode'),
      propertyName: 'mode',
      hidden: true,
      getValue: (row) => this.translate.instant(iscsiTargetModeNames.get(row.mode) || row.mode) || '-',
    }),
    actionsWithMenuColumn({
      actions: [
        {
          iconName: tnIconMarker('pencil', 'mdi'),
          tooltip: this.translate.instant('Edit'),
          onClick: (row) => this.openForm(row),
        },
        {
          iconName: tnIconMarker('delete', 'mdi'),
          tooltip: this.translate.instant('Delete'),
          onClick: (row) => this.doDelete(row),
          requiredRoles: this.requiredRoles,
        },
      ],
    }),
  ], {
    uniqueRowTag: (row) => 'card-iscsi-target-' + row.name,
    ariaLabels: (row) => [row.name, this.translate.instant('iSCSI Target')],
  });

  constructor() {
    effect(() => {
      if (this.targets()?.some((target) => target.mode !== IscsiTargetMode.Iscsi)) {
        this.columns = this.columns.map((column) => {
          if (column.propertyName === 'mode') {
            return {
              ...column,
              hidden: false,
            };
          }

          return column;
        });
        this.cdr.detectChanges();
        this.cdr.markForCheck();
      }
    });
  }

  ngOnInit(): void {
    const iscsiShares$ = this.api.call('iscsi.target.query').pipe(
      tap((targets) => {
        this.targets.set(targets);
      }),
      takeUntilDestroyed(this.destroyRef),
    );
    this.dataProvider = new AsyncDataProvider<IscsiTarget>(iscsiShares$);
    this.setDefaultSort();
    this.dataProvider.load();
  }

  openForm(row?: IscsiTarget, openWizard?: boolean): void {
    if (openWizard) {
      this.slideIn.open(IscsiWizardComponent, { data: row, wide: true })
        .onSuccess(() => this.dataProvider.load(), this.destroyRef);
    } else {
      this.slideIn.open(TargetFormComponent, { data: row, wide: true })
        .onSuccess(() => this.dataProvider.load(), this.destroyRef);
    }
  }

  doDelete(iscsi: IscsiTarget): void {
    this.matDialog
      .open(DeleteTargetDialog, { data: iscsi, width: '600px' })
      .afterClosed()
      .pipe(filter(Boolean), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.dataProvider.load());
  }

  setDefaultSort(): void {
    this.dataProvider.setSorting({
      active: 0,
      direction: SortDirection.Asc,
      propertyName: 'name',
    });
  }
}
