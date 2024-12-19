import {
  ChangeDetectionStrategy, Component,
  OnInit,
  signal,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  filter, repeat, switchMap, tap,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { IscsiTarget } from 'app/interfaces/iscsi.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { MasterDetailViewComponent } from 'app/modules/master-detail-view/master-detail-view.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TargetDetailsComponent } from 'app/pages/sharing/iscsi/target/all-targets/target-details/target-details.component';
import { TargetListComponent } from 'app/pages/sharing/iscsi/target/all-targets/target-list/target-list.component';
import { TargetFormComponent } from 'app/pages/sharing/iscsi/target/target-form/target-form.component';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IscsiService } from 'app/services/iscsi.service';
import { SlideInService } from 'app/services/slide-in.service';
import { ApiService } from 'app/services/websocket/api.service';

@UntilDestroy()
@Component({
  selector: 'ix-all-targets',
  styleUrls: ['./all-targets.component.scss'],
  templateUrl: './all-targets.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    TargetListComponent,
    MasterDetailViewComponent,
    TargetDetailsComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
  ],
})
export class AllTargetsComponent implements OnInit {
  protected dataProvider: AsyncDataProvider<IscsiTarget>;
  targets = signal<IscsiTarget[]>(null);

  readonly requiredRoles = [
    Role.SharingIscsiTargetWrite,
    Role.SharingIscsiWrite,
    Role.SharingWrite,
  ];

  constructor(
    private iscsiService: IscsiService,
    private dialogService: DialogService,
    private translate: TranslateService,
    private api: ApiService,
    private errorHandler: ErrorHandlerService,
    private loader: AppLoaderService,
    private slideInService: SlideInService,
  ) {}

  ngOnInit(): void {
    const targets$ = this.iscsiService.getTargets().pipe(
      repeat({ delay: () => this.iscsiService.listenForDataRefresh() }),
      tap((targets) => {
        this.targets.set(targets);

        const firstTarget = targets[targets.length - 1];
        if (!this.dataProvider.expandedRow && firstTarget) {
          this.dataProvider.expandedRow = firstTarget;
        }
      }),
    );

    this.dataProvider = new AsyncDataProvider(targets$);
  }

  deleteTarget(target: IscsiTarget): void {
    this.iscsiService.getGlobalSessions().pipe(untilDestroyed(this)).subscribe(
      (sessions) => {
        let warningMsg = '';
        sessions.forEach((session) => {
          if (Number(session.target.split(':')[1]) === target.id) {
            warningMsg = `<font color="red">${this.translate.instant('Warning: iSCSI Target is already in use.</font><br>')}`;
          }
        });
        const deleteMsg = this.translate.instant('Delete Target {name}', { name: target.name });

        this.dialogService.confirm({
          title: this.translate.instant('Delete'),
          message: warningMsg + deleteMsg,
          buttonText: this.translate.instant('Delete'),
        }).pipe(
          filter(Boolean),
          switchMap(() => this.api.call('iscsi.target.delete', [target.id, true]).pipe(this.loader.withLoader())),
          untilDestroyed(this),
        ).subscribe({
          next: () => {
            this.dataProvider.load();
            this.dataProvider.expandedRow = null;
          },
          error: (error: unknown) => {
            this.dialogService.error(this.errorHandler.parseError(error));
          },
        });
      },
    );
  }

  editTarget(target: IscsiTarget): void {
    const slideInRef = this.slideInService.open(
      TargetFormComponent,
      { data: target, wide: true },
    );
    slideInRef.slideInClosed$
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe((response) => {
        this.dataProvider.load();
        this.dataProvider.expandedRow = response;
      });
  }
}
