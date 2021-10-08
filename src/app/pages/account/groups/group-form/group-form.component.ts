import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import * as _ from 'lodash';
import { Observable } from 'rxjs';
import helptext from 'app/helptext/account/groups';
import { Group } from 'app/interfaces/group.interface';
import { forbiddenValues } from 'app/pages/common/entity/entity-form/validators/forbidden-values-validation';
import { regexValidator } from 'app/pages/common/entity/entity-form/validators/regex-validation';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { UserService, WebSocketService } from 'app/services';
import { IxModalService } from 'app/services/ix-modal.service';

@UntilDestroy()
@Component({
  templateUrl: 'group-form.component.html',
  styleUrls: ['./group-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupFormComponent {
  private editingGroup: Group;
  get isNew(): boolean {
    return !this.editingGroup;
  }

  isFormLoading = false;

  form = this.fb.group({
    gid: ['', [Validators.required, regexValidator(/^\d+$/)]],
    name: ['', [Validators.required, Validators.pattern(UserService.VALIDATOR_NAME)]],
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
    private modalService: IxModalService,
    private cdr: ChangeDetectorRef,
  ) {}

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

    request$.pipe(untilDestroyed(this)).subscribe(() => {
      this.isFormLoading = false;
      this.modalService.close();
    }, (error) => {
      this.isFormLoading = false;
      this.modalService.close();
      new EntityUtils().handleWSError(this, error);
    });
  }
}
