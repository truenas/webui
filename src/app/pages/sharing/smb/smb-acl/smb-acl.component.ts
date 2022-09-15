import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component,
} from '@angular/core';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { SmbSharesecPermission, SmbSharesecType } from 'app/enums/smb-sharesec.enum';
import { helptextSharingSmb } from 'app/helptext/sharing';
import { SmbSharesecAceUpdate } from 'app/interfaces/smb-share.interface';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IxValidatorsService } from 'app/modules/ix-forms/services/ix-validators.service';
import { WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

interface FormAclEntry {
  ae_who_sid: string;
  ae_who_name_domain: string;
  ae_who_name_name: string;
  ae_perm: SmbSharesecPermission;
  ae_type: SmbSharesecType;
}

@UntilDestroy()
@Component({
  templateUrl: './smb-acl.component.html',
  styleUrls: ['./smb-acl.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SmbAclComponent {
  form = this.formBuilder.group({
    entries: this.formBuilder.array<FormAclEntry>([]),
  });

  isLoading = false;

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

  shareName: string;
  private shareAclId: number;

  constructor(
    private formBuilder: FormBuilder,
    private cdr: ChangeDetectorRef,
    private ws: WebSocketService,
    private errorHandler: FormErrorHandlerService,
    private validatorService: IxValidatorsService,
    private slideIn: IxSlideInService,
    private translate: TranslateService,
  ) {}

  setSmbShareName(shareName: string): void {
    this.shareName = shareName;

    this.loadSmbAcl(shareName);
  }

  addAce(): void {
    this.form.controls.entries.push(
      this.formBuilder.group(
        {
          ae_who_sid: [''],
          ae_who_name_domain: [''],
          ae_who_name_name: [''],
          ae_perm: [null as SmbSharesecPermission],
          ae_type: [null as SmbSharesecType],
        },
        {
          validators: [this.requireSidOrDomainAndName],
        },
      ),
    );
  }

  removeAce(index: number): void {
    this.form.controls.entries.removeAt(index);
  }

  onSubmit(): void {
    this.isLoading = true;
    const acl = this.getAclEntriesFromForm();
    this.ws.call('smb.sharesec.update', [this.shareAclId, { share_acl: acl }])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.slideIn.close();
        },
        error: (error) => {
          this.isLoading = false;
          this.errorHandler.handleWsFormError(error, this.form);
          this.cdr.markForCheck();
        },
      });
  }

  private requireSidOrDomainAndName = this.validatorService.withMessage(
    (form) => {
      const values = form.value;
      if (values.ae_who_sid || (values.ae_who_name_domain && values.ae_who_name_name)) {
        return null;
      }

      return {
        requireSidOrDomainAndName: true,
      };
    },
    this.translate.instant('Either SID or Domain Name + Name are required.'),
  );

  private loadSmbAcl(shareName: string): void {
    this.isLoading = true;
    this.ws.call('smb.sharesec.query', [[['share_name', '=', shareName]]])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (shareAcls) => {
          this.shareAclId = shareAcls[0].id;
          shareAcls[0].share_acl.forEach((ace, i) => {
            this.addAce();
            this.form.controls.entries.at(i).patchValue({
              ae_who_sid: ace.ae_who_sid,
              ae_who_name_domain: ace.ae_who_name?.domain || '',
              ae_who_name_name: ace.ae_who_name?.name || '',
              ae_perm: ace.ae_perm,
              ae_type: ace.ae_type,
            });
          });
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  private getAclEntriesFromForm(): SmbSharesecAceUpdate[] {
    return this.form.value.entries.map((ace) => {
      if (ace.ae_who_sid) {
        return {
          ae_who_sid: ace.ae_who_sid,
          ae_perm: ace.ae_perm,
          ae_type: ace.ae_type,
        };
      }

      return {
        ae_who_name: {
          domain: ace.ae_who_name_domain,
          name: ace.ae_who_name_name,
        },
        ae_perm: ace.ae_perm,
        ae_type: ace.ae_type,
      };
    });
  }
}
