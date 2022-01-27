import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { UUID } from 'angular2-uuid';
import * as _ from 'lodash';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import helptext from 'app/helptext/account/groups';
import { Group } from 'app/interfaces/group.interface';
import { Option } from 'app/interfaces/option.interface';
import { forbiddenValues } from 'app/pages/common/entity/entity-form/validators/forbidden-values-validation';
import { regexValidator } from 'app/pages/common/entity/entity-form/validators/regex-validation';
import { IxComboboxProvider } from 'app/pages/common/ix-forms/components/ix-combobox2/ix-combobox-provider';
import { FormErrorHandlerService } from 'app/pages/common/ix-forms/services/form-error-handler.service';
import { IxUserComboboxService } from 'app/pages/common/ix-forms/services/ix-user-combobox.service';
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
    userCombo: [''],
    normalCombo: [''],
  });

  readonly tooltips = {
    gid: helptext.bsdgrp_gid_tooltip,
    name: helptext.bsdgrp_group_tooltip,
    sudo: helptext.bsdgrp_sudo_tooltip,
    smb: helptext.smb_tooltip,
    allowDuplicateGid: helptext.allow_tooltip,
  };

  userProvider = this.userService.getNewProvider();
  normalPage = 0;
  readonly normalPageSize = 6;

  normalOptionsRepo: Option[];
  normalProvider: IxComboboxProvider = {
    filter: (options: Option[], filterValue: string): Observable<Option[]> => {
      if (filterValue) {
        return of(this.normalOptionsRepo.filter((option: Option) => {
          return option.label.toLowerCase().includes(filterValue.toLowerCase())
              || option.value.toString().toLowerCase().includes(filterValue.toLowerCase());
        }));
      }
      this.normalPage = 0;
      return of([...this.normalOptionsRepo.slice(0, 6)]);
    },
    nextPage: (): Observable<Option[]> => {
      this.normalPage++;
      const offset = this.normalPage * this.normalPageSize;
      if (offset >= this.normalOptionsRepo.length) {
        return of([]);
      }
      return of(this.normalOptionsRepo.slice(offset, offset + this.normalPageSize)).pipe(delay(3000));
    },
  };

  constructor(
    private fb: FormBuilder,
    private ws: WebSocketService,
    private slideInService: IxSlideInService,
    private cdr: ChangeDetectorRef,
    private errorHandler: FormErrorHandlerService,
    private translate: TranslateService,
    private userService: IxUserComboboxService,
  ) {
    this.normalOptionsRepo = [
      { label: UUID.UUID().toString().substring(0, 6), value: UUID.UUID().toString() },
      { label: UUID.UUID().toString().substring(0, 6), value: UUID.UUID().toString() },
      { label: UUID.UUID().toString().substring(0, 6), value: UUID.UUID().toString() },
      { label: UUID.UUID().toString().substring(0, 6), value: UUID.UUID().toString() },
      { label: UUID.UUID().toString().substring(0, 6), value: UUID.UUID().toString() },
      { label: UUID.UUID().toString().substring(0, 6), value: UUID.UUID().toString() },
      { label: UUID.UUID().toString().substring(0, 6), value: UUID.UUID().toString() },
      { label: UUID.UUID().toString().substring(0, 6), value: UUID.UUID().toString() },
      { label: UUID.UUID().toString().substring(0, 6), value: UUID.UUID().toString() },
      { label: UUID.UUID().toString().substring(0, 6), value: UUID.UUID().toString() },
      { label: UUID.UUID().toString().substring(0, 6), value: UUID.UUID().toString() },
      { label: UUID.UUID().toString().substring(0, 6), value: UUID.UUID().toString() },
      { label: UUID.UUID().toString().substring(0, 6), value: UUID.UUID().toString() },
      { label: UUID.UUID().toString().substring(0, 6), value: UUID.UUID().toString() },
      { label: UUID.UUID().toString().substring(0, 6), value: UUID.UUID().toString() },
      { label: UUID.UUID().toString().substring(0, 6), value: UUID.UUID().toString() },
      { label: UUID.UUID().toString().substring(0, 6), value: UUID.UUID().toString() },
      { label: UUID.UUID().toString().substring(0, 6), value: UUID.UUID().toString() },
      { label: UUID.UUID().toString().substring(0, 6), value: UUID.UUID().toString() },
      { label: UUID.UUID().toString().substring(0, 6), value: UUID.UUID().toString() },
      { label: UUID.UUID().toString().substring(0, 6), value: UUID.UUID().toString() },
      { label: UUID.UUID().toString().substring(0, 6), value: UUID.UUID().toString() },
      { label: UUID.UUID().toString().substring(0, 6), value: UUID.UUID().toString() },
      { label: UUID.UUID().toString().substring(0, 6), value: UUID.UUID().toString() },
      { label: UUID.UUID().toString().substring(0, 6), value: UUID.UUID().toString() },
      { label: UUID.UUID().toString().substring(0, 6), value: UUID.UUID().toString() },
      { label: UUID.UUID().toString().substring(0, 6), value: UUID.UUID().toString() },
      { label: UUID.UUID().toString().substring(0, 6), value: UUID.UUID().toString() },
      { label: UUID.UUID().toString().substring(0, 6), value: UUID.UUID().toString() },
      { label: UUID.UUID().toString().substring(0, 6), value: UUID.UUID().toString() },
    ];
  }

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
