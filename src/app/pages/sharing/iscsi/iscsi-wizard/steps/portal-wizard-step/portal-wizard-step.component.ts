import {
  ChangeDetectionStrategy, Component, Input, OnInit,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { map, of, switchMap } from 'rxjs';
import { IscsiAuthMethod, IscsiNewOption } from 'app/enums/iscsi.enum';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import { helptextSharingIscsi } from 'app/helptext/sharing';
import { IxValidatorsService } from 'app/modules/ix-forms/services/ix-validators.service';
import { ipv4Validator } from 'app/modules/ix-forms/validators/ip-validation';
import { IscsiWizardComponent } from 'app/pages/sharing/iscsi/iscsi-wizard/iscsi-wizard.component';
import { IscsiService } from 'app/services/iscsi.service';

@UntilDestroy()
@Component({
  selector: 'ix-portal-wizard-step',
  templateUrl: './portal-wizard-step.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortalWizardStepComponent implements OnInit {
  @Input() form: IscsiWizardComponent['form']['controls']['portal'];

  readonly helptextSharingIscsi = helptextSharingIscsi;

  readonly portalOptions$ = this.iscsiService.listPortals().pipe(
    map((portals) => {
      return portals.map((portal) => {
        const ips = portal.listen.map((ip) => ip.ip).join(', ');
        return {
          label: `${portal.tag} (${ips})`,
          value: portal.id,
        };
      });
    }),
    switchMap((options) => of([...options, { label: 'Create New', value: IscsiNewOption.New }])),
    untilDestroyed(this),
  );

  readonly authmethodOptions$ = of([
    { label: 'NONE', value: IscsiAuthMethod.None },
    { label: 'CHAP', value: IscsiAuthMethod.Chap },
    { label: 'Mutual CHAP', value: IscsiAuthMethod.ChapMutual },
  ]);

  readonly authgroupOptions$ = this.iscsiService.getAuth().pipe(
    map((records) => {
      return records.map((record) => ({ label: record.tag.toString(), value: record.tag }));
    }),
    switchMap((options) => of([...options, { label: 'Create New', value: IscsiNewOption.New }])),
    untilDestroyed(this),
  );

  readonly addressOptions$ = this.iscsiService.getIpChoices().pipe(
    choicesToOptions(),
    untilDestroyed(this),
  );

  get isNewPortal(): boolean {
    return this.form.controls.portal.enabled && this.form.value.portal === IscsiNewOption.New;
  }

  get isNewAuthgroup(): boolean {
    return this.form.controls.discovery_authgroup.enabled && this.form.value.discovery_authgroup === IscsiNewOption.New;
  }

  constructor(
    private iscsiService: IscsiService,
    private fb: FormBuilder,
    private validatorsService: IxValidatorsService,
    private translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.form.controls.portal.valueChanges.pipe(untilDestroyed(this)).subscribe((portal) => {
      if (portal === IscsiNewOption.New) {
        this.form.controls.discovery_authmethod.enable();
        this.form.controls.discovery_authgroup.enable();
        this.form.controls.listen.enable();
      } else {
        this.form.controls.discovery_authmethod.disable();
        this.form.controls.discovery_authgroup.disable();
        this.form.controls.listen.disable();
        this.form.controls.tag.disable();
        this.form.controls.user.disable();
        this.form.controls.secret.disable();
        this.form.controls.secret_confirm.disable();
      }
    });

    this.form.controls.discovery_authgroup.valueChanges.pipe(untilDestroyed(this)).subscribe((authgroup) => {
      if (authgroup === IscsiNewOption.New) {
        this.form.controls.tag.enable();
        this.form.controls.user.enable();
        this.form.controls.secret.enable();
        this.form.controls.secret_confirm.enable();
      } else {
        this.form.controls.tag.disable();
        this.form.controls.user.disable();
        this.form.controls.secret.disable();
        this.form.controls.secret_confirm.disable();
      }
    });
  }

  addAddress(): void {
    this.form.controls.listen.push(
      this.fb.control('', [
        this.validatorsService.withMessage(ipv4Validator(), this.translate.instant('Enter a valid IPv4 address.')),
        Validators.required,
      ]),
    );
  }

  removeAddress(index: number): void {
    this.form.controls.listen.removeAt(index);
  }
}
