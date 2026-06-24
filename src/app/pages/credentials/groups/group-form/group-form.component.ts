import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, ViewChild, inject, input, output, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatProgressBar } from '@angular/material/progress-bar';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { TnSelectOption } from '@truenas/ui-components';
import { combineLatest, of, take } from 'rxjs';
import { allCommands } from 'app/constants/all-commands.constant';
import { Role } from 'app/enums/role.enum';
import { Group } from 'app/interfaces/group.interface';
import {
  FormDefinition,
} from 'app/modules/forms/ix-forms/components/ix-form-renderer/form-definition.interface';
import { IxFormRendererComponent } from 'app/modules/forms/ix-forms/components/ix-form-renderer/ix-form-renderer.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { getGroupFormConfig, GroupFormValue } from 'app/pages/credentials/groups/group-form/group.form-config';
import { GroupSlice } from 'app/pages/credentials/groups/store/group.selectors';

/**
 * Thin host for the declarative group form. The fields, validators and submit
 * lifecycle live in {@link getGroupFormConfig}; this component only does the
 * async setup the renderer can't express (privilege list + current selection,
 * forbidden names, next GID), then feeds the resolved definition / edit data to
 * `<ix-form-renderer>`. Works in a legacy SlideIn (`slideInRef`) or a
 * `<tn-side-panel>` (`group` input + `closed` output + host-driven `submit()`).
 */
@Component({
  selector: 'ix-group-form',
  templateUrl: './group-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IxFormRendererComponent, MatProgressBar],
})
export class GroupFormComponent implements OnInit {
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private store$ = inject<Store<GroupSlice>>(Store);
  private destroyRef = inject(DestroyRef);

  /** Present via legacy SlideIn host; absent inside a `<tn-side-panel>`. */
  readonly slideInRef = inject<SlideInRef<Group | undefined, boolean>>(SlideInRef, { optional: true });

  /** Group to edit when hosted in a `<tn-side-panel>` (SlideIn passes it via `SlideInRef`). */
  readonly group = input<Group>();

  /** Emitted to a `<tn-side-panel>` host on a successful save (forwarded from the renderer). */
  readonly closed = output<boolean>();

  /** Public so a `<tn-side-panel>` host can role-gate its footer Save. */
  readonly requiredRoles = [Role.AccountWrite];

  protected readonly definition = signal<FormDefinition<GroupFormValue> | null>(null);
  protected readonly editData = signal<Partial<GroupFormValue> | null>(null);

  // Non-signal query: the group-list spec deep-mocks this component, and ng-mocks
  // crashes replicating a signal view-query. Reactive `canSubmit` is instead mirrored
  // from the renderer's `(canSubmitChange)` output into the signal below.
  @ViewChild(IxFormRendererComponent) private renderer?: IxFormRendererComponent;

  protected readonly canSubmitSig = signal(false);
  /** Host (`<tn-side-panel>` footer Save) reads this to enable/disable saving. */
  readonly canSubmit = this.canSubmitSig.asReadonly();

  ngOnInit(): void {
    const editingGroup = this.slideInRef ? this.slideInRef.getData() : this.group();

    combineLatest([
      this.api.call('privilege.query'),
      this.api.call('group.query'),
      editingGroup ? of(null) : this.api.call('group.get_next_gid'),
    ]).pipe(take(1), takeUntilDestroyed(this.destroyRef)).subscribe(([privileges, groups, gidDefault]) => {
      const initialPrivilegeIds = editingGroup
        ? privileges
            .filter((privilege) => privilege.local_groups.some((local) => local.gid === editingGroup.gid))
            .map((privilege) => privilege.id)
        : [];

      const privilegeOptions$ = of<TnSelectOption[]>(
        privileges.map((privilege) => ({ label: privilege.name, value: privilege.id })),
      );

      const forbiddenNames = groups
        .map((group) => group.group)
        .filter((name) => name !== editingGroup?.group);

      this.definition.set(getGroupFormConfig({
        api: this.api,
        translate: this.translate,
        store$: this.store$,
        editingGroup,
        privilegeOptions$,
        privileges,
        initialPrivilegeIds,
        forbiddenNames,
        gidDefault,
      }));

      if (editingGroup) {
        this.editData.set(this.toEditData(editingGroup, initialPrivilegeIds));
      }
    });
  }

  /** Host-driven submit (`<tn-side-panel>` footer Save) → run the renderer. */
  submit(): void {
    this.renderer?.submit();
  }

  /** Host hook (`<tn-side-panel>` closeGuard) to confirm before discarding edits. */
  hasUnsavedChanges(): boolean {
    return this.renderer?.hasUnsavedChanges() ?? false;
  }

  /** Maps a Group entity onto the form shape (GID comes from the config's value). */
  private toEditData(group: Group, privilegeIds: number[]): Partial<GroupFormValue> {
    const allSudo = !!group.sudo_commands?.includes(allCommands);
    const allSudoNoPass = !!group.sudo_commands_nopasswd?.includes(allCommands);
    return {
      name: group.group,
      sudo_commands: allSudo ? [] : (group.sudo_commands ?? []),
      sudo_commands_all: allSudo,
      sudo_commands_nopasswd: allSudoNoPass ? [] : (group.sudo_commands_nopasswd ?? []),
      sudo_commands_nopasswd_all: allSudoNoPass,
      smb: group.smb,
      privileges: privilegeIds,
    };
  }
}
