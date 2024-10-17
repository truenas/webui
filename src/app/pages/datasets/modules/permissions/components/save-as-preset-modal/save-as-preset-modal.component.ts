import { CdkScrollable } from '@angular/cdk/scrolling';
import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatIconButton, MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose,
} from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { cloneDeep, concat } from 'lodash-es';
import {
  EMPTY, Observable, catchError, combineLatest, map, of, switchMap, tap,
} from 'rxjs';
import { AclType } from 'app/enums/acl-type.enum';
import { NfsAclTag } from 'app/enums/nfs-acl.enum';
import { PosixAclTag } from 'app/enums/posix-acl.enum';
import {
  Acl, AclTemplateByPath, AclTemplateCreateParams, NfsAclItem, PosixAclItem,
} from 'app/interfaces/acl.interface';
import { DsUncachedGroup, DsUncachedUser } from 'app/interfaces/ds-cache.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { SaveAsPresetModalConfig } from 'app/pages/datasets/modules/permissions/interfaces/save-as-preset-modal-config.interface';
import { DatasetAclEditorStore } from 'app/pages/datasets/modules/permissions/stores/dataset-acl-editor.store';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { UserService } from 'app/services/user.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-save-as-preset-modal',
  templateUrl: './save-as-preset-modal.component.html',
  styleUrls: ['./save-as-preset-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogTitle,
    ReactiveFormsModule,
    CdkScrollable,
    MatDialogContent,
    NgClass,
    MatIconButton,
    TestDirective,
    IxIconComponent,
    IxInputComponent,
    FormActionsComponent,
    MatDialogActions,
    MatButton,
    MatDialogClose,
    TranslateModule,
  ],
})
export class SaveAsPresetModalComponent implements OnInit {
  form = this.fb.group({
    presetName: ['', Validators.required],
  });

  presets: AclTemplateByPath[] = [];
  isFormLoading = false;
  acl: Acl;

  constructor(
    private fb: FormBuilder,
    private ws: WebSocketService,
    private loader: AppLoaderService,
    private errorHandler: ErrorHandlerService,
    private dialogService: DialogService,
    private cdr: ChangeDetectorRef,
    private userService: UserService,
    private dialogRef: MatDialogRef<SaveAsPresetModalComponent>,
    private store: DatasetAclEditorStore,
    @Inject(MAT_DIALOG_DATA) public data: SaveAsPresetModalConfig,
  ) {}

  ngOnInit(): void {
    this.loadOptions();

    this.store.state$
      .pipe(untilDestroyed(this))
      .subscribe((state) => {
        this.isFormLoading = state.isLoading;
        this.acl = state.acl;
        this.cdr.markForCheck();
      });
  }

  isCurrentAclType(aclType: AclType): boolean {
    return aclType === this.data.aclType;
  }

  private loadOptions(): void {
    this.ws.call('filesystem.acltemplate.by_path', [{
      path: this.data.datasetPath,
      'format-options': {
        resolve_names: true,
      },
    }])
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe((presets) => {
        this.presets = this.sortPresets(presets);
        this.cdr.markForCheck();
      });
  }

  private sortPresets(presets: AclTemplateByPath[]): AclTemplateByPath[] {
    return concat(
      presets.filter((preset) => this.isCurrentAclType(preset.acltype)).sort((a, b) => (a.name < b.name ? -1 : 1)),
      presets.filter((preset) => !this.isCurrentAclType(preset.acltype)).sort((a, b) => (a.name < b.name ? -1 : 1)),
    );
  }

  onSubmit(): void {
    this.loadIds(cloneDeep(this.acl)).pipe(
      switchMap((newAcl) => {
        const payload: AclTemplateCreateParams = {
          name: this.form.value.presetName,
          acltype: this.acl.acltype,
          acl: newAcl.acl.map((acl) => {
            delete acl.who;
            return cloneDeep(acl);
          }) as NfsAclItem[] | PosixAclItem[],
        };

        return this.ws.call('filesystem.acltemplate.create', [payload]);
      }),
      this.loader.withLoader(),
      this.errorHandler.catchError(),
      untilDestroyed(this),
    ).subscribe(() => {
      this.dialogRef.close();
    });
  }

  onRemovePreset(preset: AclTemplateByPath): void {
    this.ws.call('filesystem.acltemplate.delete', [preset.id])
      .pipe(
        this.errorHandler.catchError(),
        this.loader.withLoader(),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.loadOptions();
      });
  }

  loadIds(acl: Acl): Observable<Acl> {
    const requests$: Observable<DsUncachedGroup | DsUncachedUser>[] = [];
    const userWhoToIds = new Map<string, number>();
    const groupWhoToIds = new Map<string, number>();
    for (const ace of acl.acl) {
      if ([NfsAclTag.User, PosixAclTag.User].includes(ace.tag)) {
        requests$.push(
          this.userService.getUserByName(ace.who).pipe(
            tap((user: DsUncachedUser) => userWhoToIds.set(ace.who, user.pw_uid)),
            catchError((error: unknown) => {
              this.dialogService.error(this.errorHandler.parseError(error));
              return EMPTY;
            }),
          ),
        );
      }
      if ([NfsAclTag.UserGroup, PosixAclTag.Group].includes(ace.tag)) {
        requests$.push(
          this.userService.getGroupByName(ace.who).pipe(
            tap((group: DsUncachedGroup) => groupWhoToIds.set(ace.who, group.gr_gid)),
            catchError((error: unknown) => {
              this.dialogService.error(this.errorHandler.parseError(error));
              return EMPTY;
            }),
          ),
        );
      }
    }

    const result$ = combineLatest(requests$).pipe(
      map(() => {
        const newAcl = cloneDeep(acl);
        const newAces = [];
        for (const ace of newAcl.acl) {
          if ([NfsAclTag.User, PosixAclTag.User].includes(ace.tag)) {
            const id = userWhoToIds.has(ace.who) ? userWhoToIds.get(ace.who) : -1;
            newAces.push({ ...ace, id });
            continue;
          }
          if ([NfsAclTag.UserGroup, PosixAclTag.Group].includes(ace.tag)) {
            const id = groupWhoToIds.has(ace.who) ? groupWhoToIds.get(ace.who) : -1;
            newAces.push({ ...ace, id });
            continue;
          }
          newAces.push({
            ...ace,
            id: -1,
          });
        }
        newAcl.acl = newAces as NfsAclItem[] | PosixAclItem[];
        return newAcl;
      }),
    );
    return requests$.length ? result$ : of(acl);
  }
}
