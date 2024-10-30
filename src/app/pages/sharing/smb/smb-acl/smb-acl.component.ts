import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { isNumber } from 'lodash-es';
import {
  concatMap, firstValueFrom, forkJoin, mergeMap, Observable, of, from,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
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
import { SmbBothComboboxProvider } from 'app/modules/forms/ix-forms/classes/smb-both-combobox-provider';
import { SmbGroupComboboxProvider } from 'app/modules/forms/ix-forms/classes/smb-group-combobox-provider';
import { SmbUserComboboxProvider } from 'app/modules/forms/ix-forms/classes/smb-user-combobox-provider';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxComboboxComponent } from 'app/modules/forms/ix-forms/components/ix-combobox/ix-combobox.component';
import { IxErrorsComponent } from 'app/modules/forms/ix-forms/components/ix-errors/ix-errors.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxListItemComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list-item/ix-list-item.component';
import { IxListComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/slide-ins/slide-in.token';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { UserService } from 'app/services/user.service';
import { WebSocketService } from 'app/services/ws.service';

type NameOrId = string | number | null;

interface FormAclEntry {
  ae_who_sid: string;
  ae_who: NfsAclTag.Everyone | NfsAclTag.UserGroup | NfsAclTag.User | NfsAclTag.Both | null;
  ae_perm: SmbSharesecPermission;
  ae_type: SmbSharesecType;
  user: NameOrId;
  group: NameOrId;
  both: NameOrId;
}

@UntilDestroy()
@Component({
  selector: 'ix-smb-acl',
  templateUrl: './smb-acl.component.html',
  styleUrls: ['./smb-acl.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxListComponent,
    IxListItemComponent,
    IxSelectComponent,
    IxComboboxComponent,
    IxErrorsComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class SmbAclComponent implements OnInit {
  form = this.formBuilder.group({
    entries: this.formBuilder.array<FormAclEntry>([]),
  });

  isLoading = false;

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
  readonly bothProvider = new SmbBothComboboxProvider(this.userService, 'uid', 'gid');
  readonly userProvider = new SmbUserComboboxProvider(this.userService, 'uid');
  protected groupProvider: SmbGroupComboboxProvider;

  constructor(
    private formBuilder: FormBuilder,
    private cdr: ChangeDetectorRef,
    private ws: WebSocketService,
    private errorHandler: FormErrorHandlerService,
    private translate: TranslateService,
    private userService: UserService,
    private slideInRef: SlideInRef<SmbAclComponent>,
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
        both: [null as never],
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

    of(undefined)
      .pipe(mergeMap(() => this.getAclEntriesFromForm()))
      .pipe(mergeMap((acl) => this.ws.call('sharing.smb.setacl', [{ share_name: this.shareAclName, share_acl: acl }])))
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.slideInRef.close(true);
        },
        error: (error: unknown) => {
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
              both: ace.ae_who_id?.id_type !== NfsAclTag.Everyone ? ace.ae_who_id?.id : null,
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
        let id: number;
        if (isNumber(whoIdOrName)) {
          id = Number(whoIdOrName);
        } else if (ace.ae_who === NfsAclTag.UserGroup) {
          id = (await firstValueFrom(this.userService.getGroupByName(whoIdOrName.toString())))
            .gr_gid;
        } else {
          id = (await firstValueFrom(this.userService.getUserByName(whoIdOrName.toString())))
            .pw_uid;
        }

        // TODO: Backend does not yet support BOTH value
        result.ae_who_id = { id_type: ace.ae_who === NfsAclTag.Both ? NfsAclTag.UserGroup : ace.ae_who, id };
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
      return this.ws.call('group.query', [queryArgs]);
    }

    if (ace.ae_who_id?.id_type === NfsAclTag.User) {
      const queryArgs: QueryFilter<User>[] = [['uid', '=', ace.ae_who_id?.id], ['smb', '=', true]];
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

        this.groupProvider = new SmbGroupComboboxProvider(this.userService, 'gid', initialOptions);
        this.isLoading = false;
        this.cdr.markForCheck();
      });
  }
}
