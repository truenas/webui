import {
  Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit,
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
  Observable, combineLatest, finalize, map, of, switchMap,
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
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { UserService } from 'app/services/user.service';
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
  protected readonly requiredRoles = [Role.PrivilegeWrite];

  protected isLoading = false;
  private localGroupsCache = new Map<string, Group>();
  private dsGroupsCache = new Map<string, Group>();

  protected form = this.formBuilder.group({
    name: ['', [Validators.required]],
    local_groups: [[] as string[]],
    ds_groups: [[] as string[]],
    web_shell: [false],
    roles: [[] as Role[]],
  });

  protected readonly helptext = helptextPrivilege;
  protected readonly isEnterprise = toSignal(this.store$.select(selectIsEnterprise));
  protected existingPrivilege: Privilege | undefined;

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
        label: this.translate.instant(roleNames.get(role.name) || role.name),
        value: role.name,
      }));
    }),
  );

  readonly localGroupsProvider: ChipsProvider = (query: string) => {
    const filters: (['local', '=', true] | ['group', '^', string])[] = [['local', '=', true]];
    if (query?.trim()) {
      filters.push(['group', '^', query.trim()]);
    }

    // Limit to 50 groups per query to prevent performance issues in large AD environments
    return this.api.call('group.query', [filters, { limit: 50, order_by: ['group'] }]).pipe(
      map((groups) => {
        // Cache groups for later UID resolution using Map for O(1) lookups
        groups.forEach((group) => {
          this.localGroupsCache.set(group.group, group);
        });
        return groups.map((group) => group.group);
      }),
    );
  };

  readonly dsGroupsProvider: ChipsProvider = (query: string) => {
    const filters: (['local', '=', false] | ['group', '^', string])[] = [['local', '=', false]];
    if (query?.trim()) {
      filters.push(['group', '^', query.trim()]);
    }

    // Limit to 50 groups per query to prevent performance issues in large AD environments
    return this.api.call('group.query', [filters, { limit: 50, order_by: ['group'] }]).pipe(
      map((groups) => {
        // Cache groups for later UID resolution using Map for O(1) lookups
        groups.forEach((group) => {
          this.dsGroupsCache.set(group.group, group);
        });
        return groups.map((group) => group.group);
      }),
    );
  };

  constructor(
    private formBuilder: FormBuilder,
    private translate: TranslateService,
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private errorHandler: FormErrorHandlerService,
    private store$: Store<AppState>,
    private dialog: DialogService,
    private userService: UserService,
    public slideInRef: SlideInRef<Privilege | undefined, boolean>,
  ) {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });
    this.existingPrivilege = this.slideInRef.getData();
  }

  ngOnInit(): void {
    if (this.existingPrivilege) {
      this.setPrivilegeForEdit(this.existingPrivilege);
      if (this.existingPrivilege.builtin_name) {
        this.form.controls.name.disable();
        this.form.controls.roles.disable();
      }
    }
  }

  setPrivilegeForEdit(existingPrivilege: Privilege): void {
    // Pre-populate cache with existing groups to avoid unnecessary API calls on submit
    const localGroupsWithNames: string[] = [];
    const dsGroupsWithNames: string[] = [];

    existingPrivilege.local_groups.forEach((group) => {
      if (group.group) {
        this.localGroupsCache.set(group.group, group);
        localGroupsWithNames.push(group.group);
      } else {
        // For missing groups, store the placeholder with the GID for later resolution
        const placeholder = this.translate.instant('Missing group - {gid}', { gid: group.gid });
        localGroupsWithNames.push(placeholder);
        // Cache the placeholder so it resolves to the GID
        this.localGroupsCache.set(placeholder, group);
      }
    });

    existingPrivilege.ds_groups.forEach((group) => {
      if (group.group) {
        this.dsGroupsCache.set(group.group, group);
        dsGroupsWithNames.push(group.group);
      }
    });

    this.form.patchValue({
      ...existingPrivilege,
      local_groups: localGroupsWithNames,
      ds_groups: dsGroupsWithNames,
    });
    this.cdr.markForCheck();
  }

  onSubmit(): void {
    this.isLoading = true;

    combineLatest([this.localGroupsUids$, this.dsGroupsUids$]).pipe(
      switchMap(([localGroups, dsGroups]) => {
        const values: PrivilegeUpdate = {
          ...this.form.value,
          local_groups: localGroups,
          ds_groups: dsGroups,
        };

        return this.existingPrivilege
          ? this.api.call('privilege.update', [this.existingPrivilege.id, values])
          : this.api.call('privilege.create', [values]);
      }),
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
        this.slideInRef.close({ response: true, error: null });
        this.cdr.markForCheck();
      },
      error: (error: unknown) => {
        this.isLoading = false;
        this.errorHandler.handleValidationErrors(error, this.form);
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

  private get localGroupsUids$(): Observable<number[]> {
    const groupNames = this.form.value.local_groups;
    if (!groupNames.length) {
      return of([]);
    }

    // Check cache first, fetch missing groups in a single batch query
    const cachedUids: number[] = [];
    const missingNames: string[] = [];

    groupNames.forEach((name) => {
      const cached = this.localGroupsCache.get(name);
      if (cached) {
        // Exclude placeholder groups for deleted/missing groups (they have null group name)
        if (cached.group !== null) {
          cachedUids.push(cached.gid);
        }
      } else {
        missingNames.push(name);
      }
    });

    if (!missingNames.length) {
      return of(cachedUids);
    }

    // Fetch missing groups in a single batch query (not N+1)
    return this.api.call('group.query', [[
      ['local', '=', true],
      ['group', 'in', missingNames],
    ]]).pipe(
      map((groups) => {
        // Cache the fetched groups
        groups.forEach((group) => {
          this.localGroupsCache.set(group.group, group);
        });
        // Return all UIDs (cached + newly fetched)
        return [...cachedUids, ...groups.map((group) => group.gid)];
      }),
    );
  }

  private get dsGroupsUids$(): Observable<number[]> {
    const groupNames = this.form.value.ds_groups;
    if (!groupNames.length) {
      return of([]);
    }

    // Check cache first, fetch missing groups in a single batch query
    const cachedUids: number[] = [];
    const missingNames: string[] = [];

    groupNames.forEach((name) => {
      const cached = this.dsGroupsCache.get(name);
      if (cached) {
        // Exclude placeholder groups for deleted/missing groups (they have null group name)
        if (cached.group !== null) {
          cachedUids.push(cached.gid);
        }
      } else {
        missingNames.push(name);
      }
    });

    if (!missingNames.length) {
      return of(cachedUids);
    }

    // Fetch missing groups in a single batch query (not N+1)
    return this.api.call('group.query', [[
      ['local', '=', false],
      ['group', 'in', missingNames],
    ]]).pipe(
      map((groups) => {
        // Cache the fetched groups
        groups.forEach((group) => {
          this.dsGroupsCache.set(group.group, group);
        });
        // Return all UIDs (cached + newly fetched)
        return [...cachedUids, ...groups.map((group) => group.gid)];
      }),
    );
  }
}
