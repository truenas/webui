import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import helptext from 'app/helptext/account/groups';
import { Group } from 'app/interfaces/group.interface';
import { forbiddenValues } from 'app/modules/entity/entity-form/validators/forbidden-values-validation';
import { regexValidator } from 'app/modules/entity/entity-form/validators/regex-validation';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { groupAdded, groupChanged } from 'app/pages/account/groups/store/group.actions';
import { GroupSlice } from 'app/pages/account/groups/store/group.selectors';
import { UserService, WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  templateUrl: './group-form.component.html',
  styleUrls: ['./group-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupFormComponent {
  private editingGroup: Group;
  get isNew(): boolean {
    return !this.editingGroup;
  }
  get title(): string {
    return this.isNew ? this.translate.instant('Add Group') : this.translate.instant('Edit Group');
  }
  isFormLoading = false;

  form = this.fb.group({
    gid: [null as number, [Validators.required, regexValidator(/^\d+$/)]],
    name: ['', [Validators.required, Validators.pattern(UserService.namePattern)]],
    sudo: [false],
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
    private slideInService: IxSlideInService,
    private cdr: ChangeDetectorRef,
    private errorHandler: FormErrorHandlerService,
    private translate: TranslateService,
    private store$: Store<GroupSlice>,
  ) { }

  /**
   * @param group Skip argument to add new group.
   */
  setupForm(group?: Group): void {
    this.editingGroup = group;
    if (this.isNew) {
      this.ws.call('group.get_next_gid').pipe(untilDestroyed(this)).subscribe((nextId) => {
        this.form.patchValue({
          gid: nextId,
        });
        this.cdr.markForCheck();
      });
      this.setNamesInUseValidator();
    } else {
      this.form.get('gid').disable();
      this.form.patchValue({
        gid: this.editingGroup.gid,
        name: this.editingGroup.group,
        sudo: this.editingGroup.sudo,
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
      this.form.get('name').addValidators(forbiddenValues(forbiddenNames));
    });
  }

  onSubmit(): void {
    const values = this.form.value;
    const commonBody = {
      name: values.name,
      smb: values.smb,
      sudo: values.sudo,
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
          this.store$.dispatch(groupAdded({ group }));
        } else {
          this.store$.dispatch(groupChanged({ group }));
        }
        this.isFormLoading = false;
        this.slideInService.close();
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.isFormLoading = false;
        this.errorHandler.handleWsFormError(error, this.form);
        this.cdr.markForCheck();
      },
    });
  }
}
