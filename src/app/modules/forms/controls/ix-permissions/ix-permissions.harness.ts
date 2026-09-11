import { ComponentHarness, parallel } from '@angular/cdk/testing';
import { TnCheckboxHarness } from '@truenas/ui-components';
import { PosixPermission } from 'app/enums/posix-acl.enum';
import { parseMode } from 'app/helpers/mode.helper';
import { IxFormControlHarness } from 'app/modules/forms/ix-forms/interfaces/ix-form-control-harness.interface';
import { getErrorText } from 'app/modules/forms/ix-forms/utils/harness.utils';

export class IxPermissionsHarness extends ComponentHarness implements IxFormControlHarness {
  static readonly hostSelector = 'ix-permissions';

  getCheckboxHarnesses = this.locatorForAll(TnCheckboxHarness);
  getErrorText = getErrorText;

  /**
   * Always '': the control renders no label of its own since it became a bare control, so the
   * enclosing `tn-form-field` is what names it. `TnFormControlHarness` reads the label off that
   * field and only delegates the *value* here, so nothing asks this for a name.
   */
  getLabelText(): Promise<string> {
    return Promise.resolve('');
  }

  async getValue(): Promise<string> {
    const permissions = await this.getCheckboxHarnesses();
    let owner = 0;
    let grp = 0;
    let other = 0;

    if (await permissions[0].isChecked()) {
      owner += 4;
    }

    if (await permissions[1].isChecked()) {
      owner += 2;
    }

    if (await permissions[2].isChecked()) {
      owner += 1;
    }

    if (await permissions[3].isChecked()) {
      grp += 4;
    }

    if (await permissions[4].isChecked()) {
      grp += 2;
    }

    if (await permissions[5].isChecked()) {
      grp += 1;
    }

    if (permissions.length > 6) {
      if (await permissions[6].isChecked()) {
        other += 4;
      }

      if (await permissions[7].isChecked()) {
        other += 2;
      }

      if (await permissions[8].isChecked()) {
        other += 1;
      }
    }

    return Promise.resolve(owner.toString() + grp.toString() + other.toString());
  }

  async setValue(value: string): Promise<void> {
    const checkboxes = await this.getCheckboxHarnesses();

    const permissions = parseMode(value);
    return Promise.all([
      permissions.owner[PosixPermission.Read] ? checkboxes[0].check() : checkboxes[0].uncheck(),
      permissions.owner[PosixPermission.Write] ? checkboxes[1].check() : checkboxes[1].uncheck(),
      permissions.owner[PosixPermission.Execute] ? checkboxes[2].check() : checkboxes[2].uncheck(),
      permissions.group[PosixPermission.Read] ? checkboxes[3].check() : checkboxes[3].uncheck(),
      permissions.group[PosixPermission.Write] ? checkboxes[4].check() : checkboxes[4].uncheck(),
      permissions.group[PosixPermission.Execute] ? checkboxes[5].check() : checkboxes[5].uncheck(),
      permissions.other[PosixPermission.Read] ? checkboxes[6].check() : checkboxes[6].uncheck(),
      permissions.other[PosixPermission.Write] ? checkboxes[7].check() : checkboxes[7].uncheck(),
      permissions.other[PosixPermission.Execute] ? checkboxes[8].check() : checkboxes[8].uncheck(),
    ]).then(() => {});
  }

  async isDisabled(): Promise<boolean> {
    const checkboxes = await this.getCheckboxHarnesses();
    const inputState = await parallel(() => checkboxes.map((control) => control.isDisabled()));

    return inputState.every((control) => !!control);
  }
}
