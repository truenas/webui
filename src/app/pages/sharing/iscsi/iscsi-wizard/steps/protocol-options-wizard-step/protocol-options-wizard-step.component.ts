import {
  ChangeDetectionStrategy, Component, input, OnInit,
} from '@angular/core';
import { Validators, ReactiveFormsModule } from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { map, of, switchMap } from 'rxjs';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import { helptextSharingIscsi } from 'app/helptext/sharing';
import { newOption } from 'app/interfaces/option.interface';
import { IxChipsComponent } from 'app/modules/forms/ix-forms/components/ix-chips/ix-chips.component';
import { IxListItemComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list-item/ix-list-item.component';
import { IxListComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { ipValidator } from 'app/modules/forms/ix-forms/validators/ip-validation';
import { IscsiWizardComponent } from 'app/pages/sharing/iscsi/iscsi-wizard/iscsi-wizard.component';
import { IscsiService } from 'app/services/iscsi.service';

@UntilDestroy()
@Component({
  selector: 'ix-protocol-options-wizard-step',
  templateUrl: './protocol-options-wizard-step.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IxSelectComponent,
    IxListComponent,
    IxListItemComponent,
    IxChipsComponent,
    TranslateModule,
  ],
})
export class ProtocolOptionsWizardStepComponent implements OnInit {
  form = input<IscsiWizardComponent['form']['controls']['options']>();
  isFibreChannelMode = input(false);

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
    switchMap((options) => of([
      ...options,
      { label: this.translate.instant('Create New'), value: newOption },
    ])),
    untilDestroyed(this),
  );

  readonly addressOptions$ = this.iscsiService.getIpChoices().pipe(
    choicesToOptions(),
    untilDestroyed(this),
  );

  get isNewPortal(): boolean {
    return this.form().controls.listen.enabled && this.form().value.portal === newOption;
  }

  constructor(
    private iscsiService: IscsiService,
    private fb: FormBuilder,
    private translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.form().controls.portal.valueChanges.pipe(untilDestroyed(this)).subscribe((portal) => {
      if (portal === newOption) {
        this.form().controls.listen.enable();
        this.form().controls.listen.addValidators(Validators.required);
      } else {
        this.form().controls.listen.disable();
        this.form().controls.listen.removeValidators(Validators.required);
      }
    });
  }

  addAddress(): void {
    this.form().controls.listen.push(
      this.fb.control('', [Validators.required, ipValidator('all')]),
    );
  }

  removeAddress(index: number): void {
    this.form().controls.listen.removeAt(index);
  }
}
