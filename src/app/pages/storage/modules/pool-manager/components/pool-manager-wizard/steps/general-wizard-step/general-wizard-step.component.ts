import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { choicesToOptions } from 'app/helpers/options.helper';
import helptext from 'app/helptext/storage/volumes/manager/manager';
import { Option } from 'app/interfaces/option.interface';
import { PoolManagerWizardComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/pool-manager-wizard.component';
import { DialogService, WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'ix-general-wizard-step',
  templateUrl: './general-wizard-step.component.html',
  styleUrls: ['./general-wizard-step.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeneralWizardStepComponent implements OnInit {
  @Input() form: PoolManagerWizardComponent['form']['controls']['general'];
  @Input() hasNonUniqueSerialDisks: boolean;
  includeNonUniqueSerialDisks = false;
  allowNonUniqueSerialDisksOptions$: Observable<Option[]> = of([
    { label: this.translate.instant('Allow'), value: 'true' },
    { label: this.translate.instant('Don\'t Allow'), value: 'false' },
  ]);

  readonly encryptionAlgorithmOptions$ = this.ws.call('pool.dataset.encryption_algorithm_choices').pipe(
    choicesToOptions(),
  );

  constructor(
    private ws: WebSocketService,
    private dialog: DialogService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.form.controls.encryption_standard.disable();
    this.form.controls.encryption.valueChanges.pipe(untilDestroyed(this)).subscribe((isEncrypted) => {
      if (isEncrypted) {
        this.dialog.confirm({
          title: this.translate.instant('Warning'),
          message: helptext.manager_encryption_message,
          buttonText: this.translate.instant('I Understand'),
        }).pipe(untilDestroyed(this)).subscribe((confirmed) => {
          if (!confirmed) {
            this.form.controls.encryption.setValue(false);
            this.form.controls.encryption_standard.disable();
          } else {
            this.form.controls.encryption_standard.enable();
          }
          this.cdr.markForCheck();
        });
      } else {
        this.form.controls.encryption_standard.disable();
        this.cdr.markForCheck();
      }
    });
  }

  allowNonUniqueSerialDisks(allow: boolean): void {
    this.includeNonUniqueSerialDisks = allow;
  }
}
