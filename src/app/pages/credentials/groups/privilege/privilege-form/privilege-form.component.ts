import {
  Component, ChangeDetectionStrategy, ChangeDetectorRef, Inject, OnInit,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  Observable, finalize, map, of, switchMap,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role, roleNames } from 'app/enums/role.enum';
import { helptextPrivilege } from 'app/helptext/account/priviledge';
import { Group } from 'app/interfaces/group.interface';
import { Privilege, PrivilegeUpdate } from 'app/interfaces/privilege.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { ChipsProvider } from 'app/modules/forms/ix-forms/components/ix-chips/chips-provider';
import { IxChipsComponent } from 'app/modules/forms/ix-forms/components/ix-chips/ix-chips.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/slide-ins/slide-in.token';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/services/websocket/api.service';
import { AppState } from 'app/store';
import { generalConfigUpdated } from 'app/store/system-config/system-config.actions';
import { waitForGeneralConfig } from 'app/store/system-config/system-config.selectors';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-privilege-form',
  templateUrl: './privilege-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxInputComponent,
    IxChipsComponent,
    IxSelectComponent,
    IxCheckboxComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class PrivilegeFormComponent implements OnInit {
  protected readonly requiredRoles = [Role.FullAdmin];

  protected isLoading = false;
  protected localGroups: Group[] = [];
  protected dsGroups: Group[] = [];

  protected form = this.formBuilder.group({
    name: ['', [Validators.required]],
    local_groups: [[] as string[]],
    ds_groups: [[] as string[]],
    web_shell: [false],
    roles: [[] as Role[]],
  });

  protected readonly helptext = helptextPrivilege;
  protected readonly isEnterprise = toSignal(this.store$.select(selectIsEnterprise));

  get isNew(): boolean {
    return !this.existingPrivilege;
  }

  get title(): string {
    return this.isNew
      ? this.translate.instant('New Privilege')
      : this.translate.instant('Edit Privilege');
  }

  readonly rolesOptions$ = this.api.call('privilege.roles').pipe(
    map((roles) => {
      const sortedRoles = roles.toSorted((a, b) => {
        // Show compound roles first, then sort by name.
        if (a.builtin === b.builtin) {
          return a.name.localeCompare(b.name);
        }

        return a.builtin ? 1 : -1;
      });

      return sortedRoles.map((role) => ({
        label: roleNames.has(role.name) ? this.translate.instant(roleNames.get(role.name)) : role.name,
        value: role.name,
      }));
    }),
  );

  readonly localGroupsProvider: ChipsProvider = (query: string) => {
    return this.api.call('group.query', [[['local', '=', true]]]).pipe(
      map((groups) => {
        this.localGroups = groups;
        const chips = groups.map((group) => group.group);
        return chips.filter((item) => item.trim().toLowerCase().includes(query.trim().toLowerCase()));
      }),
    );
  };

  readonly dsGroupsProvider: ChipsProvider = (query: string) => {
    return this.api.call('group.query', [[['local', '=', false]]]).pipe(
      map((groups) => {
        this.dsGroups = groups;
        const chips = groups.map((group) => group.group);
        return chips.filter((item) => item.trim().toLowerCase().includes(query.trim().toLowerCase()));
      }),
    );
  };

  constructor(
    private formBuilder: FormBuilder,
    private translate: TranslateService,
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private errorHandler: FormErrorHandlerService,
    private slideInRef: SlideInRef<PrivilegeFormComponent>,
    private store$: Store<AppState>,
    private dialog: DialogService,
    @Inject(SLIDE_IN_DATA) private existingPrivilege: Privilege,
  ) { }

  ngOnInit(): void {
    if (this.existingPrivilege) {
      this.setPrivilegeForEdit();
      if (this.existingPrivilege.builtin_name) {
        this.form.controls.name.disable();
        this.form.controls.roles.disable();
      }
    }
  }

  setPrivilegeForEdit(): void {
    this.form.patchValue({
      ...this.existingPrivilege,
      local_groups: this.existingPrivilege.local_groups.map(
        (group) => group.group || this.translate.instant('Missing group - {gid}', { gid: group.gid }),
      ),
      ds_groups: this.existingPrivilege.ds_groups.map((group) => group.group),
    });
    this.cdr.markForCheck();
  }

  onSubmit(): void {
    const values: PrivilegeUpdate = {
      ...this.form.value,
      local_groups: this.localGroupsUids,
      ds_groups: this.dsGroupsUids,
    };

    this.isLoading = true;
    let request$: Observable<Privilege>;
    if (this.isNew) {
      request$ = this.api.call('privilege.create', [values]);
    } else {
      request$ = this.api.call('privilege.update', [this.existingPrivilege.id, values]);
    }

    request$.pipe(
      switchMap(() => this.store$.pipe(waitForGeneralConfig)),
      switchMap((generalConfig) => {
        if (this.isEnterprise() && !generalConfig.ds_auth) {
          return this.enableDsAuth();
        }
        return of(null);
      }),
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.isLoading = false;
        this.slideInRef.close(true);
        this.cdr.markForCheck();
      },
      error: (error: unknown) => {
        this.isLoading = false;
        this.errorHandler.handleWsFormError(error, this.form);
        this.cdr.markForCheck();
      },
    });
  }

  private enableDsAuth(): Observable<unknown> {
    return this.dialog.confirm({
      title: this.translate.instant('Allow access'),
      message: this.translate.instant('Allow Directory Service users to access WebUI?'),
      buttonText: this.translate.instant('Allow'),
    }).pipe(
      switchMap((confirmed) => {
        if (confirmed) {
          return this.api.call('system.general.update', [{ ds_auth: true }])
            .pipe(finalize(() => this.store$.dispatch(generalConfigUpdated())));
        }
        return of(null);
      }),
    );
  }

  private get localGroupsUids(): number[] {
    return this.localGroups
      .filter((group) => this.form.value.local_groups.includes(group.group))
      .map((group) => group.gid);
  }

  private get dsGroupsUids(): number[] {
    return this.dsGroups
      .filter((group) => this.form.value.ds_groups.includes(group.group))
      .map((group) => group.gid);
  }
}
