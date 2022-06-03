import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { CloudsyncCredential } from 'app/interfaces/cloudsync-credential.interface';
import { CloudsyncProvider } from 'app/interfaces/cloudsync-provider.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { DialogService, WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  templateUrl: './cloud-credentials-form.component.html',
  styleUrls: ['./cloud-credentials-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CloudCredentialsFormComponent implements OnInit {
  form = this.formBuilder.group({
    name: ['', Validators.required],
    provider: [''],
  });

  isLoading = false;
  existingCredential: CloudsyncCredential;
  providers: CloudsyncProvider[] = [];

  constructor(
    private ws: WebSocketService,
    private formBuilder: FormBuilder,
    private cdr: ChangeDetectorRef,
    private slideInService: IxSlideInService,
    private dialogService: DialogService,
  ) {}

  get selectedProvider(): CloudsyncProvider {
    return this.providers.find((provider) => provider.name === this.form.value.provider);
  }

  ngOnInit(): void {
    this.loadProviders();
  }

  setCredentialsForEdit(credential: CloudsyncCredential): void {
    this.existingCredential = credential;
    this.form.patchValue(credential);
  }

  onSubmit(): void {
    this.isLoading = true;

    // const credential:
  }

  onVerify(): void {

  }

  private loadProviders(): void {
    this.isLoading = true;
    this.ws.call('cloudsync.providers')
      .pipe(untilDestroyed(this))
      .subscribe(
        (providers) => {
          this.providers = providers;
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        (error) => {
          new EntityUtils().handleWsError(null, error, this.dialogService);
          this.slideInService.close();
        },
      );
  }
}
