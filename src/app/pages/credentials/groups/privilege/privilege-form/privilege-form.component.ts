import { Component, ChangeDetectionStrategy, OnInit, signal, inject } from '@angular/core';
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
import { AppState } from 'app/store';
import { generalConfigUpdated } from 'app/store/system-config/system-config.actions';
import { waitForGeneralConfig } from 'app/store/system-config/system-config.selectors';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-privilege-form',
  templateUrl: './privilege-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  private formBuilder = inject(FormBuilder);
  private translate = inject(TranslateService);
  private api = inject(ApiService);
  private errorHandler = inject(FormErrorHandlerService);
  private store$ = inject<Store<AppState>>(Store);
  private dialog = inject(DialogService);
  slideInRef = inject<SlideInRef<Privilege | undefined, boolean>>(SlideInRef);

  protected readonly requiredRoles = [Role.PrivilegeWrite];

  /**
   * Maximum number of groups to return in autocomplete queries.
   * Limits API response size for better performance.
   */
  private readonly GROUP_QUERY_LIMIT = 50;

  protected isLoading = signal(false);

  form = this.formBuilder.group({
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

  /**
   * Provider for local groups autocomplete.
   *
   * Fetches local groups from API with search filtering:
   * - Uses '^' prefix filter for server-side search
   * - Falls back to client-side includes() for better UX (contains match)
   * - Limited to 50 results for performance
   *
   * Note: No caching to keep implementation simple and avoid stale data issues.
   */
  readonly localGroupsProvider: ChipsProvider = (query: string) => {
    const trimmedQuery = query?.trim().toLowerCase() || '';

    const filters: (['local', '=', true] | ['group', '^', string])[] = [['local', '=', true]];
    if (trimmedQuery) {
      filters.push(['group', '^', trimmedQuery]);
    }

    return this.api.call('group.query', [filters, { limit: this.GROUP_QUERY_LIMIT, order_by: ['group'] }]).pipe(
      map((groups) => {
        const groupNames = groups.map((group) => group.group);
        // Client-side filtering for contains match (better UX)
        if (!trimmedQuery) {
          return groupNames;
        }

        return groupNames.filter((name) => name.toLowerCase().includes(trimmedQuery));
      }),
    );
  };

  /**
   * Provider for directory service groups autocomplete.
   *
   * Fetches DS groups from API with search filtering:
   * - Uses '^' prefix filter for server-side search
   * - Falls back to client-side includes() for better UX (contains match)
   * - Limited to 50 results for performance
   *
   * Note: No caching to keep implementation simple and avoid stale data issues.
   */
  readonly dsGroupsProvider: ChipsProvider = (query: string) => {
    const trimmedQuery = query?.trim().toLowerCase() || '';

    const filters: (['local', '=', false] | ['group', '^', string])[] = [['local', '=', false]];
    if (trimmedQuery) {
      filters.push(['group', '^', trimmedQuery]);
    }

    return this.api.call('group.query', [filters, { limit: this.GROUP_QUERY_LIMIT, order_by: ['group'] }]).pipe(
      map((groups) => {
        const groupNames = groups.map((group) => group.group);
        // Client-side filtering for contains match (better UX)
        if (!trimmedQuery) {
          return groupNames;
        }

        return groupNames.filter((name) => name.toLowerCase().includes(trimmedQuery));
      }),
    );
  };

  constructor() {
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

  private setPrivilegeForEdit(existingPrivilege: Privilege): void {
    this.form.patchValue({
      ...existingPrivilege,
      local_groups: existingPrivilege.local_groups.map(
        (group) => group.group || this.translate.instant('Missing group - {gid}', { gid: group.gid }),
      ),
      ds_groups: existingPrivilege.ds_groups.map((group) => group.group),
    });
  }

  onSubmit(): void {
    this.isLoading.set(true);

    // Resolve all group names to UIDs before submitting
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
        this.isLoading.set(false);
        this.slideInRef.close({ response: true });
      },
      error: (error: unknown) => {
        this.isLoading.set(false);
        this.errorHandler.handleValidationErrors(error, this.form);
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

  /**
   * Resolves local group names to GIDs.
   *
   * Uses a single batch query with 'group in' filter to avoid N+1 queries.
   * This is more efficient than querying each group individually.
   *
   * Throws an error if any requested groups are not found, preventing silent data loss.
   *
   * @returns Observable of group IDs (gids)
   * @throws Error if any requested groups don't exist
   */
  private get localGroupsUids$(): Observable<number[]> {
    const groupNames = this.form.value.local_groups;
    if (!groupNames.length) {
      return of([]);
    }

    // Fetch all groups in a single batch query
    return this.api.call('group.query', [[
      ['local', '=', true],
      ['group', 'in', groupNames],
    ]]).pipe(
      map((groups) => {
        // Validate that all requested groups were found
        const foundNames = new Set(groups.map((group) => group.group));
        const missingGroups = groupNames.filter((name) => !foundNames.has(name));

        if (missingGroups.length > 0) {
          throw new Error(this.translate.instant(
            'The following local groups were not found: {groups}. They may have been deleted.',
            { groups: missingGroups.join(', ') },
          ));
        }

        return groups.map((group) => group.gid);
      }),
    );
  }

  /**
   * Resolves directory service group names to GIDs.
   *
   * Uses a single batch query with 'group in' filter to avoid N+1 queries.
   * This is more efficient than querying each group individually.
   *
   * Throws an error if any requested groups are not found, preventing silent data loss.
   *
   * @returns Observable of group IDs (gids)
   * @throws Error if any requested groups don't exist
   */
  private get dsGroupsUids$(): Observable<number[]> {
    const groupNames = this.form.value.ds_groups;
    if (!groupNames.length) {
      return of([]);
    }

    // Fetch all groups in a single batch query
    return this.api.call('group.query', [[
      ['local', '=', false],
      ['group', 'in', groupNames],
    ]]).pipe(
      map((groups) => {
        // Validate that all requested groups were found
        const foundNames = new Set(groups.map((group) => group.group));
        const missingGroups = groupNames.filter((name) => !foundNames.has(name));

        if (missingGroups.length > 0) {
          throw new Error(this.translate.instant(
            'The following directory service groups were not found: {groups}. They may have been deleted.',
            { groups: missingGroups.join(', ') },
          ));
        }

        return groups.map((group) => group.gid);
      }),
    );
  }
}
