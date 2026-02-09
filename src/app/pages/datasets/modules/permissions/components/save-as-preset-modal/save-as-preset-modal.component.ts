import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, signal, inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatIconButton, MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose,
} from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { TnIconComponent } from '@truenas/ui-components';
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
import { Group } from 'app/interfaces/group.interface';
import { User } from 'app/interfaces/user.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { SaveAsPresetModalConfig } from 'app/pages/datasets/modules/permissions/interfaces/save-as-preset-modal-config.interface';
import { DatasetAclEditorStore } from 'app/pages/datasets/modules/permissions/stores/dataset-acl-editor.store';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { UserService } from 'app/services/user.service';

@Component({
  selector: 'ix-save-as-preset-modal',
  templateUrl: './save-as-preset-modal.component.html',
  styleUrls: ['./save-as-preset-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogTitle,
    ReactiveFormsModule,
    MatDialogContent,
    NgClass,
    MatIconButton,
    TestDirective,
    TnIconComponent,
    IxInputComponent,
    FormActionsComponent,
    MatDialogActions,
    MatButton,
    MatDialogClose,
    TranslateModule,
  ],
})
export class SaveAsPresetModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private loader = inject(LoaderService);
  private errorHandler = inject(ErrorHandlerService);
  private cdr = inject(ChangeDetectorRef);
  private userService = inject(UserService);
  private dialogRef = inject<MatDialogRef<SaveAsPresetModalComponent>>(MatDialogRef);
  private store = inject(DatasetAclEditorStore);
  private destroyRef = inject(DestroyRef);
  data = inject<SaveAsPresetModalConfig>(MAT_DIALOG_DATA);

  form = this.fb.group({
    presetName: ['', Validators.required],
  });

  presets: AclTemplateByPath[] = [];
  protected isFormLoading = signal(false);
  acl: Acl;

  ngOnInit(): void {
    this.loadOptions();

    this.store.state$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((state) => {
        this.isFormLoading.set(state.isLoading);
        this.acl = state.acl;
        this.cdr.markForCheck();
      });
  }

  isCurrentAclType(aclType: AclType): boolean {
    return aclType === this.data.aclType;
  }

  private loadOptions(): void {
    this.api.call('filesystem.acltemplate.by_path', [{
      path: this.data.datasetPath,
      'format-options': {
        resolve_names: true,
      },
    }])
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.withErrorHandler(),
        takeUntilDestroyed(this.destroyRef),
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

        return this.api.call('filesystem.acltemplate.create', [payload]);
      }),
      this.loader.withLoader(),
      this.errorHandler.withErrorHandler(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.dialogRef.close();
    });
  }

  onRemovePreset(preset: AclTemplateByPath): void {
    this.api.call('filesystem.acltemplate.delete', [preset.id])
      .pipe(
        this.errorHandler.withErrorHandler(),
        this.loader.withLoader(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.loadOptions();
      });
  }

  loadIds(acl: Acl): Observable<Acl> {
    const requests$: Observable<Group | User>[] = [];
    const userWhoToIds = new Map<string, number>();
    const groupWhoToIds = new Map<string, number>();

    // Deduplicate users and groups to avoid redundant API calls
    const uniqueUsers = new Set<string>();
    const uniqueGroups = new Set<string>();

    for (const ace of acl.acl) {
      if ([NfsAclTag.User, PosixAclTag.User].includes(ace.tag) && ace.who) {
        uniqueUsers.add(ace.who);
      }
      if ([NfsAclTag.UserGroup, PosixAclTag.Group].includes(ace.tag) && ace.who) {
        uniqueGroups.add(ace.who);
      }
    }

    // Make API calls only for unique users
    uniqueUsers.forEach((who) => {
      requests$.push(
        this.userService.getUserByNameCached(who).pipe(
          tap((user) => userWhoToIds.set(who, user.uid)),
          catchError((error: unknown) => {
            this.errorHandler.showErrorModal(error);
            return EMPTY;
          }),
        ),
      );
    });

    // Make API calls only for unique groups
    uniqueGroups.forEach((who) => {
      requests$.push(
        this.userService.getGroupByNameCached(who).pipe(
          tap((group) => groupWhoToIds.set(who, group.gid)),
          catchError((error: unknown) => {
            this.errorHandler.showErrorModal(error);
            return EMPTY;
          }),
        ),
      );
    });

    const result$ = combineLatest(requests$).pipe(
      map(() => {
        const newAcl = cloneDeep(acl);
        const newAces = [];
        for (const ace of newAcl.acl) {
          if ([NfsAclTag.User, PosixAclTag.User].includes(ace.tag) && ace.who) {
            const id = userWhoToIds.has(ace.who) ? userWhoToIds.get(ace.who) : -1;
            newAces.push({ ...ace, id });
            continue;
          }
          if ([NfsAclTag.UserGroup, PosixAclTag.Group].includes(ace.tag) && ace.who) {
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
