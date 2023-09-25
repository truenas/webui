import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  concatMap, forkJoin, from, Observable, of,
} from 'rxjs';
import { NfsAclTag, smbAclTagLabels } from 'app/enums/nfs-acl.enum';
import { SmbSharesecPermission, SmbSharesecType } from 'app/enums/smb-sharesec.enum';
import { mapToOptions } from 'app/helpers/options.helper';
import { helptextSharingSmb } from 'app/helptext/sharing';
import { Group } from 'app/interfaces/group.interface';
import { Option } from 'app/interfaces/option.interface';
import { QueryFilter } from 'app/interfaces/query-api.interface';
import { SmbSharesecAce } from 'app/interfaces/smb-share.interface';
import { User } from 'app/interfaces/user.interface';
import { GroupComboboxProvider } from 'app/modules/ix-forms/classes/group-combobox-provider';
import { UserComboboxProvider } from 'app/modules/ix-forms/classes/user-combobox-provider';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { UserService } from 'app/services/user.service';
import { WebSocketService } from 'app/services/ws.service';

interface FormAclEntry {
  ae_who_sid: string;
  ae_who: NfsAclTag.Everyone | NfsAclTag.UserGroup | NfsAclTag.User | null;
  ae_perm: SmbSharesecPermission;
  ae_type: SmbSharesecType;
  user: number | null;
  group: number | null;
}

@UntilDestroy()
@Component({
  templateUrl: './smb-acl.component.html',
  styleUrls: ['./smb-acl.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SmbAclComponent implements OnInit {
  form = this.formBuilder.group({
    entries: this.formBuilder.array<FormAclEntry>([]),
  });

  isLoading = false;

  private shareAclName: string;

  readonly tags$ = of(mapToOptions(smbAclTagLabels, this.translate));

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
  ]);

  readonly types$ = of([
    {
      label: 'ALLOWED',
      value: SmbSharesecType.Allowed,
    },
    {
      label: 'DENIED',
      value: SmbSharesecType.Denied,
    },
  ]);

  readonly helptext = helptextSharingSmb;
  readonly nfsAclTag = NfsAclTag;
  readonly userProvider = new UserComboboxProvider(this.userService, 'uid');
  protected groupProvider: GroupComboboxProvider;

  constructor(
    private formBuilder: FormBuilder,
    private cdr: ChangeDetectorRef,
    private ws: WebSocketService,
    private errorHandler: FormErrorHandlerService,
    private translate: TranslateService,
    private userService: UserService,
    private slideInRef: IxSlideInRef<SmbAclComponent>,
    @Inject(SLIDE_IN_DATA) public shareName: string,
  ) {}

  ngOnInit(): void {
    if (this.shareName) {
      this.setSmbShareName();
    }
  }

  setSmbShareName(): void {
    this.loadSmbAcl(this.shareName);
  }

  addAce(): void {
    this.form.controls.entries.push(
      this.formBuilder.group({
        ae_who_sid: [''],
        ae_who: [null as never],
        user: [null as never],
        group: [null as never],
        ae_perm: [null as SmbSharesecPermission],
        ae_type: [null as SmbSharesecType],
      }),
    );
  }

  removeAce(index: number): void {
    this.form.controls.entries.removeAt(index);
  }

  onSubmit(): void {
    this.isLoading = true;
    const acl = this.getAclEntriesFromForm();

    this.ws.call('sharing.smb.setacl', [{ share_name: this.shareAclName, share_acl: acl }])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.slideInRef.close();
        },
        error: (error) => {
          this.isLoading = false;
          this.errorHandler.handleWsFormError(error, this.form);
          this.cdr.markForCheck();
        },
      });
  }

  private loadSmbAcl(shareName: string): void {
    this.isLoading = true;
    this.ws.call('sharing.smb.getacl', [{ share_name: shareName }])
      .pipe(untilDestroyed(this))
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
              group: ace.ae_who_id?.id_type !== NfsAclTag.Everyone ? ace.ae_who_id?.id : null,
              user: ace.ae_who_id?.id_type !== NfsAclTag.Everyone ? ace.ae_who_id?.id : null,
            });
          });
          this.extractOptionFromAcl(shareAcl.share_acl);
        },
        error: () => {
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  private getAclEntriesFromForm(): SmbSharesecAce[] {
    return this.form.value.entries.map((ace) => {
      const whoId = ace.ae_who === NfsAclTag.UserGroup ? ace.group : ace.user;

      const result = { ae_perm: ace.ae_perm, ae_type: ace.ae_type } as SmbSharesecAce;

      if (ace.ae_who !== this.nfsAclTag.Everyone) {
        result.ae_who_id = { id_type: ace.ae_who, id: whoId };
      }

      if (ace.ae_who === NfsAclTag.Everyone) {
        result.ae_who_sid = 'S-1-1-0';
      }

      return result;
    });
  }

  private initialValueDataFromAce(
    ace: SmbSharesecAce,
  ): Observable<Group[]> | Observable<User[]> | Observable<string[]> {
    if (ace.ae_who_id?.id_type === NfsAclTag.UserGroup) {
      const queryArgs: QueryFilter<Group>[] = [['gid', '=', ace.ae_who_id?.id]];
      return this.ws.call('group.query', [queryArgs]);
    }

    if (ace.ae_who_id?.id_type === NfsAclTag.User) {
      const queryArgs: QueryFilter<Group>[] = [['uid', '=', ace.ae_who_id?.id]];
      return this.ws.call('user.query', [queryArgs]);
    }

    return of([]);
  }

  private extractOptionFromAcl(shareAcl: SmbSharesecAce[]): void {
    from(shareAcl)
      .pipe(
        concatMap((ace: SmbSharesecAce) => {
          return forkJoin(
            this.initialValueDataFromAce(ace),
          );
        }),
      )
      .pipe(untilDestroyed(this))
      .subscribe((data: unknown[][]) => {
        const response = data[0];
        const initialOptions: Option[] = [];

        if (response.length) {
          let option: Option;
          if ((response as Group[])[0].gid) {
            option = { label: (response as Group[])[0].group, value: (response as Group[])[0].gid };
          } else if (
            (response as User[])[0].uid
            || (response as User[])[0].uid?.toString() === '0'
          ) {
            option = { label: (response as User[])[0].username, value: (response as User[])[0].uid };
          } else {
            return;
          }
          initialOptions.push(option);
        }

        this.groupProvider = new GroupComboboxProvider(this.userService, 'gid', initialOptions);
        this.isLoading = false;
        this.cdr.markForCheck();
      });
  }
}
