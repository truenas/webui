import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { allCommands } from 'app/constants/all-commands.constant';
import helptext from 'app/helptext/account/groups';
import { Group } from 'app/interfaces/group.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { forbiddenValues } from 'app/modules/ix-forms/validators/forbidden-values-validation/forbidden-values-validation';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { groupAdded, groupChanged } from 'app/pages/account/groups/store/group.actions';
import { GroupSlice } from 'app/pages/account/groups/store/group.selectors';
import { UserService } from 'app/services/user.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './group-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupFormComponent implements OnInit {
  get isNew(): boolean {
    return !this.editingGroup;
  }
  get title(): string {
    return this.isNew ? this.translate.instant('Add Group') : this.translate.instant('Edit Group');
  }
  isFormLoading = false;

  form = this.fb.group({
    gid: [null as number, [Validators.required, Validators.pattern(/^\d+$/)]],
    name: ['', [Validators.required, Validators.pattern(UserService.namePattern)]],
    sudo_commands: [[] as string[]],
    sudo_commands_all: [false],
    sudo_commands_nopasswd: [[] as string[]],
    sudo_commands_nopasswd_all: [false],
    smb: [false],
    allowDuplicateGid: [false],
  });

  readonly tooltips = {
    gid: helptext.bsdgrp_gid_tooltip,
    name: helptext.bsdgrp_group_tooltip,
    sudo: helptext.bsdgrp_sudo_tooltip,
    smb: helptext.smb_tooltip,
    allowDuplicateGid: helptext.allow_tooltip,
  };

  constructor(
    private fb: FormBuilder,
    private ws: WebSocketService,
    private slideInRef: IxSlideInRef<GroupFormComponent>,
    private cdr: ChangeDetectorRef,
    private errorHandler: FormErrorHandlerService,
    private translate: TranslateService,
    private store$: Store<GroupSlice>,
    private snackbar: SnackbarService,
    @Inject(SLIDE_IN_DATA) private editingGroup: Group,
  ) { }

  ngOnInit(): void {
    this.setupForm();
  }

  setupForm(): void {
    this.setFormRelations();

    if (this.isNew) {
      this.ws.call('group.get_next_gid').pipe(untilDestroyed(this)).subscribe((nextId) => {
        this.form.patchValue({
          gid: nextId,
        });
        this.cdr.markForCheck();
      });
      this.setNamesInUseValidator();
    } else {
      this.form.controls.gid.disable();
      this.form.patchValue({
        gid: this.editingGroup.gid,
        name: this.editingGroup.group,
        sudo_commands: this.editingGroup.sudo_commands.includes(allCommands) ? [] : this.editingGroup.sudo_commands,
        sudo_commands_all: this.editingGroup.sudo_commands.includes(allCommands),
        sudo_commands_nopasswd: this.editingGroup.sudo_commands_nopasswd?.includes(allCommands)
          ? []
          : this.editingGroup.sudo_commands_nopasswd,
        sudo_commands_nopasswd_all: this.editingGroup.sudo_commands_nopasswd?.includes(allCommands),
        smb: this.editingGroup.smb,
        allowDuplicateGid: true,
      });
      this.setNamesInUseValidator(this.editingGroup.group);
    }
  }

  private setNamesInUseValidator(currentName?: string): void {
    this.ws.call('group.query').pipe(untilDestroyed(this)).subscribe((groups) => {
      let forbiddenNames = groups.map((group) => group.group);
      if (currentName) {
        forbiddenNames = _.remove(forbiddenNames, currentName);
      }
      this.form.controls.name.addValidators(forbiddenValues(forbiddenNames));
    });
  }

  onSubmit(): void {
    const values = this.form.value;
    const commonBody = {
      name: values.name,
      smb: values.smb,
      sudo_commands: values.sudo_commands_all ? [allCommands] : values.sudo_commands,
      sudo_commands_nopasswd: values.sudo_commands_nopasswd_all ? [allCommands] : values.sudo_commands_nopasswd,
      allow_duplicate_gid: values.allowDuplicateGid,
    };

    this.isFormLoading = true;
    let request$: Observable<unknown>;
    if (this.isNew) {
      request$ = this.ws.call('group.create', [{
        ...commonBody,
        gid: values.gid,
      }]);
    } else {
      request$ = this.ws.call('group.update', [
        this.editingGroup.id,
        commonBody,
      ]);
    }

    request$.pipe(
      switchMap((id) => this.ws.call('group.query', [[['id', '=', id]]])),
      map((groups) => groups[0]),
      untilDestroyed(this),
    ).subscribe({
      next: (group) => {
        if (this.isNew) {
          this.snackbar.success(this.translate.instant('Group added'));
          this.store$.dispatch(groupAdded({ group }));
        } else {
          this.snackbar.success(this.translate.instant('Group updated'));
          this.store$.dispatch(groupChanged({ group }));
        }
        this.isFormLoading = false;
        this.slideInRef.close();
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.isFormLoading = false;
        this.errorHandler.handleWsFormError(error, this.form);
        this.cdr.markForCheck();
      },
    });
  }

  private setFormRelations(): void {
    this.form.controls.sudo_commands_all.valueChanges.pipe(untilDestroyed(this)).subscribe((isAll) => {
      if (isAll) {
        this.form.controls.sudo_commands.disable();
      } else {
        this.form.controls.sudo_commands.enable();
      }
    });

    this.form.controls.sudo_commands_nopasswd_all.valueChanges.pipe(untilDestroyed(this)).subscribe((isAll) => {
      if (isAll) {
        this.form.controls.sudo_commands_nopasswd.disable();
      } else {
        this.form.controls.sudo_commands_nopasswd.enable();
      }
    });
  }
}
