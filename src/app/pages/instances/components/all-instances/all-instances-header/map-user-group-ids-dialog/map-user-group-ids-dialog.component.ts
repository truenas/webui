import {
  ChangeDetectionStrategy, Component, OnInit, signal,
} from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconButton } from '@angular/material/button';
import { MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow,
  MatRowDef,
  MatTable,
} from '@angular/material/table';
import { MatTooltip } from '@angular/material/tooltip';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  finalize, map, Observable, of,
} from 'rxjs';
import { EmptyType } from 'app/enums/empty-type.enum';
import { instancesHelptext } from 'app/helptext/instances/instances';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import { directIdMapping } from 'app/interfaces/user.interface';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import {
  IxButtonGroupComponent,
} from 'app/modules/forms/ix-forms/components/ix-button-group/ix-button-group.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TooltipComponent } from 'app/modules/tooltip/tooltip.component';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  IdMapping,
  ViewType,
} from 'app/pages/instances/components/all-instances/all-instances-header/map-user-group-ids-dialog/mapping.types';
import {
  NewMappingFormComponent,
} from 'app/pages/instances/components/all-instances/all-instances-header/map-user-group-ids-dialog/new-mapping-form/new-mapping-form.component';
import { ErrorHandlerService } from 'app/services/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-map-user-group-ids-dialog',
  templateUrl: './map-user-group-ids-dialog.component.html',
  styleUrls: ['./map-user-group-ids-dialog.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FakeProgressBarComponent,
    IxIconComponent,
    MatDialogContent,
    MatDialogTitle,
    MatIconButton,
    TranslateModule,
    TestDirective,
    EmptyComponent,
    FormsModule,
    MatCell,
    MatCellDef,
    MatColumnDef,
    MatHeaderCell,
    MatHeaderRow,
    MatHeaderRowDef,
    MatRow,
    MatRowDef,
    MatTable,
    ReactiveFormsModule,
    MatTooltip,
    MatHeaderCellDef,
    NewMappingFormComponent,
    TooltipComponent,
    IxButtonGroupComponent,
  ],
})
export class MapUserGroupIdsDialogComponent implements OnInit {
  protected readonly columns = ['name', 'hostUidOrGid', 'instanceUidOrGid', 'actions'];
  protected readonly containersHelptext = instancesHelptext;

  protected readonly isLoading = signal(false);
  protected readonly mappings = signal<IdMapping[]>([]);

  protected readonly noEntries = {
    type: EmptyType.NoPageData,
    large: true,
    message: this.translate.instant('No entries have been mapped yet.'),
  } as EmptyConfig;

  protected readonly typeControl = new FormControl(ViewType.Users);

  protected readonly typeOptions$ = of([
    {
      label: this.translate.instant('Users'),
      value: ViewType.Users,
    },
    {
      label: this.translate.instant('Groups'),
      value: ViewType.Groups,
    },
  ]);

  constructor(
    private api: ApiService,
    private errorHandler: ErrorHandlerService,
    protected dialogRef: MatDialogRef<MapUserGroupIdsDialogComponent>,
    private translate: TranslateService,
    private loader: AppLoaderService,
    private snackbar: SnackbarService,
  ) {}

  ngOnInit(): void {
    this.loadMappings();

    this.loadMappingOnTypeChanges();
  }

  private loadMappingOnTypeChanges(): void {
    this.typeControl.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(() => this.loadMappings());
  }

  protected loadMappings(): void {
    this.isLoading.set(true);

    let request$: Observable<IdMapping[]>;

    if (this.typeControl.value === ViewType.Users) {
      request$ = this.api.call('user.query', [[['local', '=', true], ['userns_idmap', '!=', null]]]).pipe(
        map((users) => users.map((user) => ({
          name: user.username,
          systemId: user.id,
          hostUidOrGid: user.uid,
          instanceUidOrGid: user.userns_idmap,
        }))),
      );
    } else {
      request$ = this.api.call('group.query', [[['local', '=', true], ['userns_idmap', '!=', null]]]).pipe(
        map((groups) => groups.map((group) => ({
          name: group.group,
          systemId: group.id,
          hostUidOrGid: group.gid,
          instanceUidOrGid: group.userns_idmap,
        }))),
      );
    }

    request$
      .pipe(
        this.errorHandler.catchError(),
        finalize(() => this.isLoading.set(false)),
        untilDestroyed(this),
      )
      .subscribe((mappings) => {
        this.mappings.set(mappings);
      });
  }

  protected onClearMapping(mapping: IdMapping): void {
    let request$: Observable<unknown>;

    if (this.typeControl.value === ViewType.Users) {
      request$ = this.api.call('user.update', [mapping.systemId, { userns_idmap: null }]);
    } else {
      request$ = this.api.call('group.update', [mapping.systemId, { userns_idmap: null }]);
    }

    request$
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('Mapping has been cleared.'));
        this.loadMappings();
      });
  }

  protected readonly directIdMapping = directIdMapping;
  protected readonly ViewType = ViewType;
}
