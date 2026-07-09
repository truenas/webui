import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, signal, inject, input,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormControl } from '@ngneat/reactive-forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnAutocompleteComponent, TnFormFieldComponent, TnFormSectionComponent, TnSelectComponent,
} from '@truenas/ui-components';
import { isNumber } from 'lodash-es';
import {
  BehaviorSubject, catchError, combineLatest, concatMap, debounceTime, distinctUntilChanged, firstValueFrom, from,
  map, mergeMap, Observable, of, shareReplay, switchMap, tap, toArray,
} from 'rxjs';
import { NfsAclTag, smbAclTagLabels } from 'app/enums/nfs-acl.enum';
import { Role } from 'app/enums/role.enum';
import { SmbSharesecPermission, SmbSharesecType } from 'app/enums/smb-sharesec.enum';
import { mapToOptions } from 'app/helpers/options.helper';
import { helptextSharingSmb } from 'app/helptext/sharing';
import { Group } from 'app/interfaces/group.interface';
import { Option } from 'app/interfaces/option.interface';
import { QueryFilter } from 'app/interfaces/query-api.interface';
import { SmbSharesecAce } from 'app/interfaces/smb-share.interface';
import { User } from 'app/interfaces/user.interface';
import { IxErrorsComponent } from 'app/modules/forms/ix-forms/components/ix-errors/ix-errors.component';
import { IxFormHostForm } from 'app/modules/forms/ix-forms/components/ix-form/ix-form-host-form.directive';
import {
  FormSubmitEvent, IxFormComponent, SubmitResult,
} from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { IxListItemComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list-item/ix-list-item.component';
import { IxListComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list.component';
import { defaultDebounceTimeMs } from 'app/modules/forms/ix-forms/ix-forms.constants';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { UserService } from 'app/services/user.service';

type NameOrId = string | number | null;

interface FormAclEntry {
  ae_who_sid: string;
  ae_who: NfsAclTag.Everyone | NfsAclTag.UserGroup | NfsAclTag.User | null;
  ae_perm: SmbSharesecPermission;
  ae_type: SmbSharesecType;
  user: NameOrId;
  group: NameOrId;
  both: NameOrId;
}

@Component({
  selector: 'ix-smb-acl',
  templateUrl: './smb-acl.component.html',
  styleUrls: ['./smb-acl.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    ReactiveFormsModule,
    IxFormComponent,
    TnFormFieldComponent,
    TnFormSectionComponent,
    TnSelectComponent,
    IxListComponent,
    IxListItemComponent,
    TnAutocompleteComponent,
    IxErrorsComponent,
    TranslateModule,
  ],
})
export class SmbAclComponent extends IxFormHostForm implements OnInit {
  private formBuilder = inject(FormBuilder);
  private api = inject(ApiService);
  private formErrorHandler = inject(FormErrorHandlerService);
  private errorHandler = inject(ErrorHandlerService);
  private translate = inject(TranslateService);
  private userService = inject(UserService);
  private destroyRef = inject(DestroyRef);

  /** Share name supplied by the `<tn-side-panel>` host. */
  readonly shareName = input<string | undefined>(undefined);

  form = this.formBuilder.group({
    entries: this.formBuilder.array<FormAclEntry>([]),
  });

  protected isLoading = signal(false);

  private resolvedShareName: string | undefined;
  private shareAclName: string;

  readonly tags$ = of(mapToOptions(smbAclTagLabels, this.translate));
  readonly requiredRoles = [Role.SharingSmbWrite, Role.SharingWrite];
  readonly permissions$ = of([
    {
      label: 'FULL',
      value: SmbSharesecPermission.Full,
    },
    {
      label: 'CHANGE',
      value: SmbSharesecPermission.Change,
    },
    {
      label: 'READ',
      value: SmbSharesecPermission.Read,
    },
  ] as Option[]);

  readonly types$ = of([
    {
      label: 'ALLOWED',
      value: SmbSharesecType.Allowed,
    },
    {
      label: 'DENIED',
      value: SmbSharesecType.Denied,
    },
  ] as Option[]);

  readonly helptext = helptextSharingSmb;
  readonly nfsAclTag = NfsAclTag;

  // Options seeded from the loaded ACL so existing uid/gid values display as
  // names (the search query below only covers what the user has typed).
  private readonly initialUserOptions$ = new BehaviorSubject<Option[]>([]);
  private readonly initialGroupOptions$ = new BehaviorSubject<Option[]>([]);

  // Server-searched option streams for the per-entry user/group autocompletes.
  // All entries share one stream per kind — options only matter while that
  // dropdown is open — and shareReplay collapses the `async` subscribers into a
  // single SMB directory query per search. Option values are uid/gid numbers;
  // free-typed names commit as strings and are resolved to ids on submit
  // (see `getAclEntriesFromForm`), matching the old combobox behavior.
  // On a failed fetch the stream stays alive with empty options and the dropdown
  // shows "Options cannot be loaded" via [noResultsText] — the same in-panel
  // signal the old ix-combobox rendered (a modal per failed keystroke query
  // would be far noisier than the transient panel notice).
  protected readonly usersFetchFailed = signal(false);
  protected readonly usersLoading = signal(false);
  protected readonly userSearch$ = new BehaviorSubject('');
  protected readonly userOptions$ = combineLatest([
    this.userSearch$.pipe(
      debounceTime(defaultDebounceTimeMs),
      distinctUntilChanged(),
      tap(() => this.usersLoading.set(true)),
      switchMap((query) => this.userService.smbUserQueryDsCache(query).pipe(
        tap(() => this.usersFetchFailed.set(false)),
        catchError((error: unknown) => {
          console.error('SMB user autocomplete fetch failed:', error);
          this.usersFetchFailed.set(true);
          return of([] as User[]);
        }),
      )),
      map((users) => users.map((user) => ({ label: user.username, value: user.uid }))),
      tap(() => this.usersLoading.set(false)),
    ),
    this.initialUserOptions$,
  ]).pipe(
    map(([options, initial]) => [
      ...initial.filter((item) => !options.some((option) => option.value === item.value)),
      ...options,
    ]),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  protected readonly groupsFetchFailed = signal(false);
  protected readonly groupsLoading = signal(false);
  protected readonly groupSearch$ = new BehaviorSubject('');
  protected readonly groupOptions$ = combineLatest([
    this.groupSearch$.pipe(
      debounceTime(defaultDebounceTimeMs),
      distinctUntilChanged(),
      tap(() => this.groupsLoading.set(true)),
      switchMap((query) => this.userService.smbGroupQueryDsCache(query, false).pipe(
        tap(() => this.groupsFetchFailed.set(false)),
        catchError((error: unknown) => {
          console.error('SMB group autocomplete fetch failed:', error);
          this.groupsFetchFailed.set(true);
          return of([] as Group[]);
        }),
      )),
      map((groups) => groups.map((group) => ({ label: group.group, value: group.gid }))),
      tap(() => this.groupsLoading.set(false)),
    ),
    this.initialGroupOptions$,
  ]).pipe(
    map(([options, initial]) => [
      ...initial.filter((item) => !options.some((option) => option.value === item.value)),
      ...options,
    ]),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  ngOnInit(): void {
    // Share name arrives via the `shareName` input from the side-panel host.
    this.resolvedShareName = this.shareName();
    if (this.resolvedShareName) {
      this.loadSmbAcl(this.resolvedShareName);
    }
  }

  addAce(): void {
    this.form.controls.entries.push(
      this.formBuilder.group({
        ae_who_sid: [''],
        ae_who: [null as never],
        both: [null as never],
        user: [null as never],
        group: [null as never],
        ae_perm: new FormControl(null as SmbSharesecPermission | null),
        ae_type: new FormControl(null as SmbSharesecType | null),
      }),
    );
  }

  removeAce(index: number): void {
    this.form.controls.entries.removeAt(index);
  }

  protected handleSubmit = (_: FormSubmitEvent): SubmitResult => {
    const request$ = of(undefined).pipe(
      mergeMap(() => this.getAclEntriesFromForm()),
      mergeMap((acl) => this.api.call('sharing.smb.setacl', [{ share_name: this.shareAclName, share_acl: acl }])),
    );

    return {
      request$,
      successMessage: this.translate.instant('Share ACL updated'),
      onError: (error: unknown) => {
        this.formErrorHandler.handleValidationErrors(error, this.form);
        return true;
      },
    };
  };

  private loadSmbAcl(shareName: string): void {
    this.isLoading.set(true);
    this.api.call('sharing.smb.getacl', [{ share_name: shareName }])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (shareAcl) => {
          this.shareAclName = shareAcl.share_name;
          shareAcl.share_acl.forEach((ace, i) => {
            this.addAce();

            this.form.controls.entries.at(i).patchValue({
              ae_who_sid: ace.ae_who_sid,
              ae_who: ace.ae_who_id?.id_type || ace.ae_who_str as NfsAclTag.Everyone,
              ae_perm: ace.ae_perm,
              ae_type: ace.ae_type,
              both: ace.ae_who_id?.id_type !== NfsAclTag.Everyone ? ace.ae_who_id?.id : null,
              group: ace.ae_who_id?.id_type !== NfsAclTag.Everyone ? ace.ae_who_id?.id : null,
              user: ace.ae_who_id?.id_type !== NfsAclTag.Everyone ? ace.ae_who_id?.id : null,
            });
          });
          this.extractOptionFromAcl(shareAcl.share_acl);
        },
        error: (error: unknown) => {
          this.errorHandler.showErrorModal(error);
          this.isLoading.set(false);
        },
      });
  }

  private async getAclEntriesFromForm(): Promise<SmbSharesecAce[]> {
    const results = [] as SmbSharesecAce[];
    for (const ace of this.form.value.entries) {
      let whoIdOrName = ace.both;
      if (ace.ae_who === NfsAclTag.User) {
        whoIdOrName = ace.user;
      } else if (ace.ae_who === NfsAclTag.UserGroup) {
        whoIdOrName = ace.group;
      }

      const result = { ae_perm: ace.ae_perm, ae_type: ace.ae_type } as SmbSharesecAce;

      if (ace.ae_who === NfsAclTag.Everyone) {
        result.ae_who_sid = 'S-1-1-0';
      } else {
        // Explicit null check to fail fast with clear error instead of calling API with "null" string
        if (!whoIdOrName && whoIdOrName !== 0) {
          throw new Error(`ACE entry requires a user/group identifier but got: ${whoIdOrName}`);
        }

        let id: number;
        if (isNumber(whoIdOrName)) {
          id = Number(whoIdOrName);
        } else if (ace.ae_who === NfsAclTag.UserGroup) {
          id = (await firstValueFrom(this.userService.getGroupByNameCached(String(whoIdOrName))))
            .gid;
        } else {
          id = (await firstValueFrom(this.userService.getUserByNameCached(String(whoIdOrName))))
            .uid;
        }

        result.ae_who_id = { id_type: ace.ae_who, id };
      }
      results.push(result);
    }
    return results;
  }

  private initialValueDataFromAce(
    ace: SmbSharesecAce,
  ): Observable<Group[]> | Observable<User[]> | Observable<string[]> {
    if (ace.ae_who_id?.id_type === NfsAclTag.UserGroup) {
      const queryArgs: QueryFilter<Group>[] = [['gid', '=', ace.ae_who_id?.id], ['smb', '=', true]];
      return this.api.call('group.query', [queryArgs]);
    }

    if (ace.ae_who_id?.id_type === NfsAclTag.User) {
      const queryArgs: QueryFilter<User>[] = [['uid', '=', ace.ae_who_id?.id], ['smb', '=', true]];
      return this.api.call('user.query', [queryArgs]);
    }

    return of([]);
  }

  private extractOptionFromAcl(shareAcl: SmbSharesecAce[]): void {
    from(shareAcl)
      .pipe(
        concatMap((ace: SmbSharesecAce) => {
          return this.initialValueDataFromAce(ace);
        }),
        toArray(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((aceData) => {
        const userOptions: Option[] = [];
        const groupOptions: Option[] = [];

        aceData.flat().forEach((item) => {
          if (typeof item === 'string') {
            return;
          }
          if ('gid' in item) {
            groupOptions.push({ label: item.group, value: item.gid } as Option);
          } else if ('uid' in item) {
            userOptions.push({ label: item.username, value: item.uid } as Option);
          }
        });

        this.initialUserOptions$.next(userOptions);
        this.initialGroupOptions$.next(groupOptions);
        this.isLoading.set(false);
      });
  }
}
