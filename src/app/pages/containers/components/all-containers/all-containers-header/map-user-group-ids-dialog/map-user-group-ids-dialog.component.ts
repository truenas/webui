import { DialogRef } from '@angular/cdk/dialog';
import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, signal, inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnCellDefDirective,
  TnDialogShellComponent,
  TnEmptyComponent,
  TnHeaderCellDefDirective,
  TnIconButtonComponent,
  TnIconComponent,
  TnSpinnerComponent,
  TnTableColumnDirective,
  TnTableComponent,
  TnTooltipDirective,
} from '@truenas/ui-components';
import {
  finalize, map, Observable, of,
} from 'rxjs';
import { containersHelptext } from 'app/helptext/containers/containers';
import { directIdMapping } from 'app/interfaces/user.interface';
import {
  IxButtonGroupComponent,
} from 'app/modules/forms/ix-forms/components/ix-button-group/ix-button-group.component';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  IdMapping,
  ViewType,
} from 'app/pages/containers/components/all-containers/all-containers-header/map-user-group-ids-dialog/mapping.types';
import {
  NewMappingFormComponent,
} from 'app/pages/containers/components/all-containers/all-containers-header/map-user-group-ids-dialog/new-mapping-form/new-mapping-form.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-map-user-group-ids-dialog',
  templateUrl: './map-user-group-ids-dialog.component.html',
  styleUrls: ['./map-user-group-ids-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    TnDialogShellComponent,
    FakeProgressBarComponent,
    TnIconComponent,
    TnIconButtonComponent,
    TnSpinnerComponent,
    TnTooltipDirective,
    TranslateModule,
    TnEmptyComponent,
    FormsModule,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    ReactiveFormsModule,
    NewMappingFormComponent,
    IxButtonGroupComponent,
  ],
})
export class MapUserGroupIdsDialogComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  protected dialogRef = inject<DialogRef<unknown, MapUserGroupIdsDialogComponent>>(DialogRef);
  private translate = inject(TranslateService);
  private loader = inject(LoaderService);
  private snackbar = inject(SnackbarService);

  protected readonly columns = ['name', 'hostUidOrGid', 'instanceUidOrGid', 'actions'];
  protected readonly helptext = containersHelptext;

  protected readonly isLoading = signal(true);
  protected readonly mappings = signal<IdMapping[]>([]);

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

  protected readonly idMapHintText = this.translate.instant(this.helptext.idMapHint).replace(/<br>/g, '\n');

  ngOnInit(): void {
    this.loadMappings();

    this.loadMappingOnTypeChanges();
  }

  private loadMappingOnTypeChanges(): void {
    this.typeControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
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
          description: user.username,
        }))),
      );
    } else {
      request$ = this.api.call('group.query', [[['local', '=', true], ['userns_idmap', '!=', null]]]).pipe(
        map((groups) => groups.map((group) => ({
          name: group.group,
          systemId: group.id,
          hostUidOrGid: group.gid,
          instanceUidOrGid: group.userns_idmap,
          description: group.group,
        }))),
      );
    }

    request$
      .pipe(
        this.errorHandler.withErrorHandler(),
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
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
        this.errorHandler.withErrorHandler(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('Mapping has been cleared.'));
        this.loadMappings();
      });
  }

  protected readonly directIdMapping = directIdMapping;
  protected readonly ViewType = ViewType;
}
