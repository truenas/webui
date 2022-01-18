import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { UUID } from 'angular2-uuid';
import * as _ from 'lodash';
import {
  concat, Observable, of,
} from 'rxjs';
import helptext from 'app/helptext/account/groups';
import { Group } from 'app/interfaces/group.interface';
import { Option } from 'app/interfaces/option.interface';
import { forbiddenValues } from 'app/pages/common/entity/entity-form/validators/forbidden-values-validation';
import { regexValidator } from 'app/pages/common/entity/entity-form/validators/regex-validation';
import { IxCombobox2Provider } from 'app/pages/common/ix-forms/components/ix-combobox2/ix-combobox2-provider.interface';
import { FormErrorHandlerService } from 'app/pages/common/ix-forms/services/form-error-handler.service';
import { IxUserComboboxProvider } from 'app/pages/common/ix-forms/services/ix-user-combobox-provider.service';
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
    userCombobox: [''],
    normalCombobox: [''],
  });

  normalProvider: IxCombobox2Provider = {
    options$: of([
      { label: UUID.UUID().substring(0, 6), value: UUID.UUID() },
      { label: UUID.UUID().substring(0, 6), value: UUID.UUID() },
    ]),
    pageOffset: 1,
    filter: (options$: Observable<Option[]>, value: string): void => {
      if (value) {
        options$.pipe(untilDestroyed(this)).subscribe((syncOptions) => {
          this.normalProvider.options$ = of(syncOptions.filter((option: Option) => {
            return option.label.toLowerCase().includes(value.toLowerCase())
                || option.value.toString().toLowerCase().includes(value.toLowerCase());
          }));
        });
      }
    },
    onScrollEnd: () => {
      this.normalProvider.pageOffset += 2;
      this.normalProvider.options$ = concat(
        this.normalProvider.options$,
        of([
          { label: UUID.UUID().substring(0, 6), value: UUID.UUID() },
          { label: UUID.UUID().substring(0, 6), value: UUID.UUID() },
        ]),
      );
    },
  };

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
    public ixUsersProvider: IxUserComboboxProvider,
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
      this.slideInService.close();
      this.cdr.markForCheck();
    }, (error) => {
      this.isFormLoading = false;
      this.errorHandler.handleWsFormError(error, this.form);
      this.cdr.markForCheck();
    });
  }
}
