import {
  ChangeDetectionStrategy, Component, Input, OnChanges, OnInit,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import {
  PosixAclTag, posixAclTagLabels, PosixPermission, posixPermissionLabels,
} from 'app/enums/posix-acl.enum';
import { mapToOptions } from 'app/helpers/options.helper';
import helptext from 'app/helptext/storage/volumes/datasets/dataset-acl';
import { PosixAclItem } from 'app/interfaces/acl.interface';
import { GroupComboboxProvider } from 'app/modules/ix-forms/classes/group-combobox-provider';
import { UserComboboxProvider } from 'app/modules/ix-forms/classes/user-combobox-provider';
import { DatasetAclEditorStore } from 'app/pages/datasets/modules/permissions/stores/dataset-acl-editor.store';
import { UserService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'ix-edit-posix-ace',
  templateUrl: './edit-posix-ace.component.html',
  styleUrls: ['./edit-posix-ace.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditPosixAceComponent implements OnInit, OnChanges {
  @Input() ace: PosixAclItem;

  form = this.formBuilder.group({
    tag: [null as PosixAclTag],
    user: [null as string],
    group: [null as string],
    permissions: [[] as PosixPermission[]],
    default: [false],
  });

  readonly tags$ = of(mapToOptions(posixAclTagLabels, this.translate));
  readonly permissions$ = of(mapToOptions(posixPermissionLabels, this.translate));

  readonly tooltips = {
    tag: helptext.posix_tag.tooltip,
    user: helptext.dataset_acl_user_tooltip,
    group: helptext.dataset_acl_group_tooltip,
    permissions: helptext.posix_perms.tooltip,
    default: helptext.posix_default.tooltip,
  };

  readonly userProvider = new UserComboboxProvider(this.userService);
  readonly groupProvider = new GroupComboboxProvider(this.userService);

  constructor(
    private userService: UserService,
    private store: DatasetAclEditorStore,
    private formBuilder: FormBuilder,
    private translate: TranslateService,
  ) {}

  get isUserTag(): boolean {
    return this.form.value.tag === PosixAclTag.User;
  }

  get isGroupTag(): boolean {
    return this.form.value.tag === PosixAclTag.Group;
  }

  ngOnInit(): void {
    this.setFormListeners();
    this.updateFormValues();
  }

  ngOnChanges(): void {
    this.updateFormValues();
  }

  private setFormListeners(): void {
    this.form.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(() => this.onAceUpdated());
    this.form.statusChanges
      .pipe(untilDestroyed(this))
      .subscribe(() => this.onFormStatusUpdated());
  }

  private onFormStatusUpdated(): void {
    this.store.updateSelectedAceValidation(this.form.valid);
  }

  private onAceUpdated(): void {
    const updatedAce = this.formValuesToAce();

    this.store.updateSelectedAce(updatedAce);
  }

  private formValuesToAce(): PosixAclItem {
    const formValues = this.form.value;

    const ace = {
      tag: formValues.tag,
      default: formValues.default,
      perms: {
        [PosixPermission.Read]: formValues.permissions.includes(PosixPermission.Read),
        [PosixPermission.Write]: formValues.permissions.includes(PosixPermission.Write),
        [PosixPermission.Execute]: formValues.permissions.includes(PosixPermission.Execute),
      },
    } as PosixAclItem;

    switch (formValues.tag) {
      case PosixAclTag.User:
        ace.who = formValues.user;
        break;
      case PosixAclTag.Group:
        ace.who = formValues.group;
        break;
    }

    return ace;
  }

  private updateFormValues(): void {
    const formValues = {
      tag: this.ace.tag,
      user: this.ace.tag === PosixAclTag.User ? this.ace.who : '',
      group: this.ace.tag === PosixAclTag.Group ? this.ace.who : '',
      default: this.ace.default,
      permissions: Object.entries(this.ace.perms)
        .filter(([, isOn]) => isOn)
        .map(([permission]) => permission as PosixPermission),
    };

    this.form.reset(formValues, { emitEvent: false });

    this.form.markAllAsTouched();

    setTimeout(() => {
      this.onFormStatusUpdated();
    });
  }
}
