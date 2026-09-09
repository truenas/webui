import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, OnInit, signal, inject,
  DestroyRef, input,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent, TnCheckboxComponent, TnFormFieldComponent, TnFormSectionComponent, TnInputComponent,
  TnSelectComponent,
} from '@truenas/ui-components';
import {
  Observable, combineLatest, finalize, map, of, switchMap,
} from 'rxjs';
import { DirectoryServiceStatus } from 'app/enums/directory-services.enum';
import { EntitlementFeature } from 'app/enums/entitlement-feature.enum';
import { Role, roleNames } from 'app/enums/role.enum';
import { helptextPrivilege } from 'app/helptext/account/priviledge';
import { DirectoryServicesStatus } from 'app/interfaces/directoryservices-status.interface';
import { Privilege, PrivilegeUpdate } from 'app/interfaces/privilege.interface';
import { IxFormHostForm } from 'app/modules/forms/ix-forms/components/ix-form/ix-form-host-form.directive';
import { IxFormComponent, SubmitResult } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { IxGroupChipsComponent } from 'app/modules/forms/ix-forms/components/user-group-pickers/ix-group-chips.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { EntitlementsService } from 'app/services/entitlements.service';
import { DirectoryQueryOptions } from 'app/services/user-directory.service';
import { AppState } from 'app/store';
import { generalConfigUpdated } from 'app/store/system-config/system-config.actions';
import { waitForGeneralConfig } from 'app/store/system-config/system-config.selectors';

@Component({
  selector: 'ix-privilege-form',
  templateUrl: './privilege-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    IxFormComponent,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnInputComponent,
    IxGroupChipsComponent,
    TnSelectComponent,
    TnCheckboxComponent,
    TnButtonComponent,
    TranslateModule,
    AsyncPipe,
  ],
})
export class PrivilegeFormComponent extends IxFormHostForm implements OnInit {
  private destroyRef = inject(DestroyRef);
  private formBuilder = inject(FormBuilder);
  private translate = inject(TranslateService);
  private api = inject(ApiService);
  private entitlements = inject(EntitlementsService);
  private errorHandler = inject(FormErrorHandlerService);
  private store$ = inject<Store<AppState>>(Store);

  protected readonly requiredRoles = [Role.PrivilegeWrite];

  /** Row to edit, passed in by `FormSidePanelService.open`. Absent for Add. */
  readonly editPrivilege = input<Privilege | undefined>(undefined);

  protected showDsAuthButton = signal(false);
  protected isEnablingDsAuth = signal(false);
  protected dsAuthEnabled = signal(false);
  private dsStatus = signal<DirectoryServicesStatus | null>(null);

  /**
   * Local groups only, built-ins included: a privilege can legitimately be
   * granted to a built-in local group, so this deliberately does not ask for
   * `mutableOnly`.
   */
  protected readonly localGroupsOptions: DirectoryQueryOptions = { localOnly: true };

  protected readonly form = this.formBuilder.group({
    name: ['', [Validators.required]],
    local_groups: [[] as string[]],
    ds_groups: [[] as string[]],
    web_shell: [false],
    roles: [[] as Role[]],
  });

  protected readonly helptext = helptextPrivilege;
  protected readonly hasDirectoryServices = this.entitlements.entitled(EntitlementFeature.DirectoryServicesAuth);
  protected existingPrivilege: Privilege | undefined;

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


  ngOnInit(): void {
    this.existingPrivilege = this.editPrivilege();

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
      this.refreshDsAuthButtonVisibility();
    });

    // Load directory services status once on init (cache it)
    this.api.call('directoryservices.status').pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((status) => {
      this.dsStatus.set(status);
      this.refreshDsAuthButtonVisibility();
    });

    // Watch for DS groups being added and show inline button if needed
    this.form.controls.ds_groups.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((dsGroups) => {
      this.updateDsAuthButtonVisibility(dsGroups);
    });
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
   * Re-evaluates the prompt against the groups already in the form. Editing an existing privilege
   * patches `ds_groups` during `ngOnInit`, long before `directoryservices.status` and the general
   * config resolve, so the only `valueChanges` emission runs while both are still unknown. Without
   * this, the prompt stays hidden for every privilege that already has directory service groups —
   * exactly the case where it is needed.
   */
  private refreshDsAuthButtonVisibility(): void {
    this.updateDsAuthButtonVisibility(this.form.controls.ds_groups.value);
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

    // Hide button when the system is not entitled to directory-services authentication
    if (!this.hasDirectoryServices()) {
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
  protected enableDsAuth(): void {
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

  protected handleSubmit = (): SubmitResult => {
    // Resolve all group names to UIDs before submitting.
    const request$ = combineLatest([this.localGroupsUids$, this.dsGroupsUids$]).pipe(
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
    );

    return {
      request$,
      successMessage: this.existingPrivilege
        ? this.translate.instant('Privilege updated')
        : this.translate.instant('Privilege created'),
    };
  };

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
