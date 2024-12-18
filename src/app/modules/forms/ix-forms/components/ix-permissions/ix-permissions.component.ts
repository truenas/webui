import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, input,
} from '@angular/core';
import { ControlValueAccessor, NgControl, ReactiveFormsModule } from '@angular/forms';
import { MatCheckbox } from '@angular/material/checkbox';
import { TranslateModule } from '@ngx-translate/core';
import { PosixPermission } from 'app/enums/posix-acl.enum';
import { parseMode } from 'app/helpers/mode.helper';
import { IxErrorsComponent } from 'app/modules/forms/ix-forms/components/ix-errors/ix-errors.component';
import { IxLabelComponent } from 'app/modules/forms/ix-forms/components/ix-label/ix-label.component';
import { registeredDirectiveConfig } from 'app/modules/forms/ix-forms/directives/registered-control.directive';
import { TestOverrideDirective } from 'app/modules/test-id/test-override/test-override.directive';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  selector: 'ix-permissions',
  templateUrl: './ix-permissions.component.html',
  styleUrls: ['./ix-permissions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    IxLabelComponent,
    MatCheckbox,
    ReactiveFormsModule,
    IxErrorsComponent,
    TranslateModule,
    TestOverrideDirective,
    TestDirective,
  ],
  hostDirectives: [
    { ...registeredDirectiveConfig },
  ],
})
export class IxPermissionsComponent implements ControlValueAccessor {
  readonly label = input<string>();
  readonly tooltip = input<string>();
  readonly required = input(false);
  readonly hideOthersPermissions = input(false);

  isDisabled = false;

  value: string;

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

  private formatRe = /^[0-7][0-7][0-7]$/;

  constructor(
    public controlDirective: NgControl,
    private cdr: ChangeDetectorRef,
  ) {
    this.controlDirective.valueAccessor = this;
  }

  writeValue(value: string): void {
    this.setPermissionsAndUpdateValue(value);
  }

  setPermissionsAndUpdateValue(value = '000'): void {
    if (value && this.formatRe.test(value)) {
      this.value = value;
    } else {
      this.value = '000';
      console.error('Invalid value format for ', this.label());
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

  onChange?: (value: string) => void = (): void => {};

  onTouched?: () => void = (): void => {};

  registerOnChange(onChange: (value: string | number) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouched = onTouched;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
    this.cdr.markForCheck();
  }

  toggleOwnerRead(): void {
    if (this.ownerRead) {
      this.ownerRead = false;
      this.owner -= 4;
    } else {
      this.ownerRead = true;
      this.owner += 4;
    }
    this.updateValue();
  }

  toggleOwnerWrite(): void {
    if (this.ownerWrite) {
      this.ownerWrite = false;
      this.owner -= 2;
    } else {
      this.ownerWrite = true;
      this.owner += 2;
    }
    this.updateValue();
  }

  toggleOwnerExec(): void {
    if (this.ownerExec) {
      this.ownerExec = false;
      this.owner -= 1;
    } else {
      this.ownerExec = true;
      this.owner += 1;
    }
    this.updateValue();
  }

  toggleGroupRead(): void {
    if (this.groupRead) {
      this.groupRead = false;
      this.grp -= 4;
    } else {
      this.groupRead = true;
      this.grp += 4;
    }
    this.updateValue();
  }

  toggleGroupWrite(): void {
    if (this.groupWrite) {
      this.groupWrite = false;
      this.grp -= 2;
    } else {
      this.groupWrite = true;
      this.grp += 2;
    }
    this.updateValue();
  }

  toggleGroupExec(): void {
    if (this.groupExec) {
      this.groupExec = false;
      this.grp -= 1;
    } else {
      this.groupExec = true;
      this.grp += 1;
    }
    this.updateValue();
  }

  toggleOtherRead(): void {
    if (this.otherRead) {
      this.otherRead = false;
      this.other -= 4;
    } else {
      this.otherRead = true;
      this.other += 4;
    }
    this.updateValue();
  }

  toggleOtherWrite(): void {
    if (this.otherWrite) {
      this.otherWrite = false;
      this.other -= 2;
    } else {
      this.otherWrite = true;
      this.other += 2;
    }
    this.updateValue();
  }

  toggleOtherExec(): void {
    if (this.otherExec) {
      this.otherExec = false;
      this.other -= 1;
    } else {
      this.otherExec = true;
      this.other += 1;
    }
    this.updateValue();
  }

  updateValue(): void {
    this.value = this.owner.toString() + this.grp.toString() + this.other.toString();
    this.onChange(this.value);
  }
}
