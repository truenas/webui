import {
  Component, OnInit,
} from '@angular/core';
import { AbstractControl, UntypedFormGroup } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { PosixPermission } from 'app/enums/posix-acl.enum';
import { parseMode } from 'app/helpers/mode.helper';
import { FormPermissionsConfig } from 'app/modules/entity/entity-form/models/field-config.interface';
import { Field } from 'app/modules/entity/entity-form/models/field.interface';

@UntilDestroy()
@Component({
  styleUrls: ['../dynamic-field/dynamic-field.scss', 'form-permissions.scss'],
  templateUrl: './form-permissions.component.html',
})
export class FormPermissionsComponent implements Field, OnInit {
  config: FormPermissionsConfig;
  group: UntypedFormGroup;
  fieldShow: string;

  ownerRead = false;
  ownerWrite = false;
  ownerExec = false;
  groupRead = false;
  groupWrite = false;
  groupExec = false;
  otherRead = false;
  otherWrite = false;
  otherExec = false;

  private owner = 0;
  private grp = 0;
  private other = 0;
  private value: string;
  private control: AbstractControl;

  private formatRe = new RegExp('^[0-7][0-7][0-7]$');

  constructor(public translate: TranslateService) {}

  toggleOwnerRead(): void {
    if (this.ownerRead) {
      this.ownerRead = false;
      this.owner -= 4;
    } else {
      this.ownerRead = true;
      this.owner += 4;
    }
    this.refreshPermissions();
  }

  toggleOwnerWrite(): void {
    if (this.ownerWrite) {
      this.ownerWrite = false;
      this.owner -= 2;
    } else {
      this.ownerWrite = true;
      this.owner += 2;
    }
    this.refreshPermissions();
  }

  toggleOwnerExec(): void {
    if (this.ownerExec) {
      this.ownerExec = false;
      this.owner -= 1;
    } else {
      this.ownerExec = true;
      this.owner += 1;
    }
    this.refreshPermissions();
  }

  toggleGroupRead(): void {
    if (this.groupRead) {
      this.groupRead = false;
      this.grp -= 4;
    } else {
      this.groupRead = true;
      this.grp += 4;
    }
    this.refreshPermissions();
  }

  toggleGroupWrite(): void {
    if (this.groupWrite) {
      this.groupWrite = false;
      this.grp -= 2;
    } else {
      this.groupWrite = true;
      this.grp += 2;
    }
    this.refreshPermissions();
  }

  toggleGroupExec(): void {
    if (this.groupExec) {
      this.groupExec = false;
      this.grp -= 1;
    } else {
      this.groupExec = true;
      this.grp += 1;
    }
    this.refreshPermissions();
  }

  toggleOtherRead(): void {
    if (this.otherRead) {
      this.otherRead = false;
      this.other -= 4;
    } else {
      this.otherRead = true;
      this.other += 4;
    }
    this.refreshPermissions();
  }

  toggleOtherWrite(): void {
    if (this.otherWrite) {
      this.otherWrite = false;
      this.other -= 2;
    } else {
      this.otherWrite = true;
      this.other += 2;
    }
    this.refreshPermissions();
  }

  toggleOtherExec(): void {
    if (this.otherExec) {
      this.otherExec = false;
      this.other -= 1;
    } else {
      this.otherExec = true;
      this.other += 1;
    }
    this.refreshPermissions();
  }

  refreshPermissions(): void {
    this.value = this.owner.toString() + this.grp.toString() + this.other.toString();
    this.group.controls[this.config.name].setValue(this.value);
  }

  ngOnInit(): void {
    this.control = this.group.controls[this.config.name];
    this.control.valueChanges.pipe(untilDestroyed(this)).subscribe((data: string) => {
      if (this.value !== data) {
        this.setValue(data);
        this.refreshPermissions();
      }
    });
    if (this.control.value && this.formatRe.test(this.control.value)) {
      this.setValue(this.control.value);
    } else {
      this.setValue();
    }
    this.refreshPermissions();
  }

  setValue(value = '000'): void {
    if (this.config.value && this.formatRe.test(this.config.value)) {
      this.value = this.config.value;
    } else if (value && this.formatRe.test(value)) {
      this.value = value;
    }

    this.owner = parseInt(this.value[0]);
    this.grp = parseInt(this.value[1]);
    this.other = parseInt(this.value[2]);

    const permissions = parseMode(this.value);

    this.ownerRead = permissions.owner[PosixPermission.Read];
    this.ownerWrite = permissions.owner[PosixPermission.Write];
    this.ownerExec = permissions.owner[PosixPermission.Execute];

    this.groupRead = permissions.group[PosixPermission.Read];
    this.groupWrite = permissions.group[PosixPermission.Write];
    this.groupExec = permissions.group[PosixPermission.Execute];

    this.otherRead = permissions.other[PosixPermission.Read];
    this.otherWrite = permissions.other[PosixPermission.Write];
    this.otherExec = permissions.other[PosixPermission.Execute];
  }
}
