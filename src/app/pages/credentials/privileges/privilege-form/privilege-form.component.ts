import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, OnInit, signal, inject,
  DestroyRef, input,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent, TnChipInputComponent, TnCheckboxComponent, TnFormFieldComponent,
  TnFormSectionComponent, TnInputComponent, TnSelectComponent,
} from '@truenas/ui-components';
import {
  Observable, Subject, combineLatest, finalize, map, of, switchMap,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { DirectoryServiceStatus } from 'app/enums/directory-services.enum';
import { Role, roleNames } from 'app/enums/role.enum';
import { helptextPrivilege } from 'app/helptext/account/priviledge';
import { DirectoryServicesStatus } from 'app/interfaces/directoryservices-status.interface';
import { Privilege, PrivilegeUpdate } from 'app/interfaces/privilege.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { ChipsProvider } from 'app/modules/forms/ix-forms/components/ix-chips/chips-provider';
import { IxGroupChipsComponent } from 'app/modules/forms/ix-forms/components/ix-group-chips/ix-group-chips.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { AppState } from 'app/store';
import { generalConfigUpdated } from 'app/store/system-config/system-config.actions';
import { waitForGeneralConfig } from 'app/store/system-config/system-config.selectors';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

@Component({
  selector: 'ix-privilege-form',
  templateUrl: './privilege-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ModalHeaderComponent,
    ReactiveFormsModule,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnInputComponent,
    TnChipInputComponent,
    IxGroupChipsComponent,
    TnSelectComponent,
    TnCheckboxComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    TnButtonComponent,
    TranslateModule,
    AsyncPipe,
  ],
})
export class PrivilegeFormComponent extends SidePanelForm implements OnInit {
  private destroyRef = inject(DestroyRef);
  private formBuilder = inject(FormBuilder);
  private translate = inject(TranslateService);
  private api = inject(ApiService);
  private errorHandler = inject(FormErrorHandlerService);
  private store$ = inject<Store<AppState>>(Store);

  protected readonly requiredRoles = [Role.PrivilegeWrite];

  /**
   * Row to edit when hosted in a `<tn-side-panel>` (which has no `SlideInRef` to
   * carry data). Absent for Add, and unused in the legacy SlideIn host (which
   * supplies the row via `slideInRef.getData()`).
   */
  readonly editPrivilege = input<Privilege | undefined>(undefined);

  /**
   * Maximum number of groups to return in autocomplete queries.
   * Limits API response size for better performance.
   */
  private readonly GROUP_QUERY_LIMIT = 50;

  protected isLoading = signal(false);
  protected showDsAuthButton = signal(false);
  protected isEnablingDsAuth = signal(false);
  protected dsAuthEnabled = signal(false);
  private dsStatus = signal<DirectoryServicesStatus | null>(null);

  /** String-mode suggestions for the local-groups chip input, refreshed on each search. */
  protected localGroupsSuggestions = signal<string[]>([]);

  /** Emits the latest chip-input search term; `switchMap` cancels stale in-flight queries. */
  private readonly localGroupsSearch$ = new Subject<string>();

  protected readonly form = this.formBuilder.group({
    name: ['', [Validators.required]],
    local_groups: [[] as string[]],
    ds_groups: [[] as string[]],
    web_shell: [false],
    roles: [[] as Role[]],
  });

  readonly canSubmit = this.trackCanSubmit(this.isLoading);

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
   * Uses ChipsProvider instead of GroupComboboxProvider because:
   * - Chips UI is simpler and more appropriate for multi-select privileges
   * - No pagination needed - 50-item limit is sufficient for most privilege scenarios
   * - Avoids complexity of managing paginated state across multiple chips fields
   *
   * Fetches local groups from API with search filtering:
   * - Uses '^' prefix filter for server-side search
   * - Falls back to client-side includes() for better UX (contains match)
   * - Limited to 50 results for performance
   *
   * Note: No caching to keep implementation simple and avoid stale data issues.
   * For SMB shares with larger group lists requiring pagination, see GroupComboboxProvider.
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
   * Refreshes the local-groups chip-input suggestions as the user types, driving the
   * autocomplete from {@link localGroupsProvider}.
   */
  protected onLocalGroupsSearch(query: string): void {
    this.localGroupsSearch$.next(query);
  }

  ngOnInit(): void {
    this.existingPrivilege = this.slideInRef
      ? this.slideInRef.getData() as Privilege | undefined
      : this.editPrivilege();

    if (this.existingPrivilege) {
      this.setPrivilegeForEdit(this.existingPrivilege);
      if (this.existingPrivilege.builtin_name) {
        this.form.controls.name.disable();
        this.form.controls.roles.disable();
      }
    }

    // Load current ds_auth status
    this.store$.pipe(
      waitForGeneralConfig,
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((generalConfig) => {
      this.dsAuthEnabled.set(generalConfig.ds_auth);
    });

    // Load directory services status once on init (cache it)
    this.api.call('directoryservices.status').pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((status) => {
      this.dsStatus.set(status);
    });

    // Watch for DS groups being added and show inline button if needed
    this.form.controls.ds_groups.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((dsGroups) => {
      this.updateDsAuthButtonVisibility(dsGroups);
    });

    // Drive suggestions off the latest search term only; `switchMap` cancels any
    // earlier in-flight query so out-of-order responses can't overwrite fresh results.
    this.localGroupsSearch$.pipe(
      switchMap((query) => this.localGroupsProvider(query)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((groups) => this.localGroupsSuggestions.set(groups));

    // Preload local-group suggestions so the chip-input dropdown is populated on first focus.
    this.onLocalGroupsSearch('');
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

  /**
   * Updates the visibility of the ds_auth button based on:
   * - Whether DS groups are present
   * - Whether DS is actually enabled (cached from init)
   * - Whether ds_auth is currently disabled
   * - Enterprise mode
   */
  private updateDsAuthButtonVisibility(dsGroups: string[]): void {
    // Hide button if no DS groups
    if (!dsGroups?.length) {
      this.showDsAuthButton.set(false);
      return;
    }

    // Hide button in non-enterprise mode
    if (!this.isEnterprise()) {
      this.showDsAuthButton.set(false);
      return;
    }

    // Hide button if ds_auth is already enabled
    if (this.dsAuthEnabled()) {
      this.showDsAuthButton.set(false);
      return;
    }

    // Check if Directory Services are actually enabled (using cached status)
    const status = this.dsStatus();
    const shouldShow = Boolean(status?.type && status.status !== DirectoryServiceStatus.Disabled);
    this.showDsAuthButton.set(shouldShow);
  }

  /**
   * Enables DS authentication immediately when the button is clicked.
   * This is a separate operation from saving the privilege.
   */
  enableDsAuth(): void {
    this.isEnablingDsAuth.set(true);

    this.api.call('system.general.update', [{ ds_auth: true }]).pipe(
      finalize(() => {
        this.isEnablingDsAuth.set(false);
        this.store$.dispatch(generalConfigUpdated());
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        // Update local state to hide the button
        this.dsAuthEnabled.set(true);
        this.showDsAuthButton.set(false);
      },
      error: (error: unknown) => {
        this.errorHandler.handleValidationErrors(error, this.form);
      },
    });
  }

  protected onSubmit(): void {
    this.isLoading.set(true);

    // Resolve all group names to UIDs before submitting
    combineLatest([this.localGroupsUids$, this.dsGroupsUids$]).pipe(
      switchMap(([localGroups, dsGroups]) => {
        const values: PrivilegeUpdate = {
          name: this.form.value.name,
          local_groups: localGroups,
          ds_groups: dsGroups,
          web_shell: this.form.value.web_shell,
          roles: this.form.value.roles,
        };

        return this.existingPrivilege
          ? this.api.call('privilege.update', [this.existingPrivilege.id, values])
          : this.api.call('privilege.create', [values]);
      }),
      finalize(() => this.isLoading.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        this.close(true);
      },
      error: (error: unknown) => {
        this.errorHandler.handleValidationErrors(error, this.form);
      },
    });
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
