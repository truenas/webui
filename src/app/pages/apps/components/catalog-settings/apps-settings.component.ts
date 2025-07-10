import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, OnInit, signal,
} from '@angular/core';
import {
  FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  combineLatest,
  filter,
  forkJoin,
  of,
  take,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { singleArrayToOptions } from 'app/helpers/operators/options.operators';
import { helptextApps } from 'app/helptext/apps/apps';
import { CatalogUpdate } from 'app/interfaces/catalog.interface';
import { DetailsItemComponent } from 'app/modules/details-table/details-item/details-item.component';
import { DetailsTableComponent } from 'app/modules/details-table/details-table.component';
import { EditableComponent } from 'app/modules/forms/editable/editable.component';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxCheckboxListComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox-list/ix-checkbox-list.component';
import { IxChipsComponent } from 'app/modules/forms/ix-forms/components/ix-chips/ix-chips.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxIpInputWithNetmaskComponent } from 'app/modules/forms/ix-forms/components/ix-ip-input-with-netmask/ix-ip-input-with-netmask.component';
import { IxListItemComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list-item/ix-list-item.component';
import { IxListComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ipv4or6cidrValidator } from 'app/modules/forms/ix-forms/validators/ip-validation';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { DockerStore } from 'app/pages/apps/store/docker.store';

@UntilDestroy()
@Component({
  selector: 'ix-apps-settings',
  templateUrl: './apps-settings.component.html',
  styleUrls: ['./apps-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    ModalHeaderComponent,
    MatCardContent,
    MatCard,
    IxFieldsetComponent,
    IxCheckboxListComponent,
    IxChipsComponent,
    IxListItemComponent,
    IxListComponent,
    IxIpInputWithNetmaskComponent,
    IxInputComponent,
    IxCheckboxComponent,
    FormActionsComponent,
    MatButton,
    RequiresRolesDirective,
    TestDirective,
    TranslateModule,
    AsyncPipe,
    DetailsTableComponent,
    DetailsItemComponent,
    EditableComponent,
  ],
  providers: [
    DockerStore,
  ],
})
export class AppsSettingsComponent implements OnInit {
  protected hasNvidiaCard$ = this.api.call('docker.nvidia_present');
  protected isFormLoading = signal(false);
  protected readonly requiredRoles = [Role.AppsWrite, Role.CatalogWrite];

  protected form = this.fb.nonNullable.group({
    preferred_trains: [[] as string[], Validators.required],
    nvidia: [null as boolean | null],
    enable_image_updates: [true],
    address_pools: new FormArray<FormGroup<{
      base: FormControl<string>;
      size: FormControl<number | null>;
    }>>([]),
    secure_registry_mirrors: [[] as string[]],
    insecure_registry_mirrors: [[] as string[]],
  });

  protected allTrains$ = this.api.call('catalog.trains').pipe(
    singleArrayToOptions(),
  );

  readonly tooltips = {
    preferred_trains: helptextApps.settingsForm.preferredTrains.tooltip,
    install_nvidia_driver: helptextApps.settingsForm.installNvidiaDriver.tooltip,
    registry_mirrors: helptextApps.settingsForm.registryMirrors.generalTooltip,
    secure_registry_mirrors: helptextApps.settingsForm.registryMirrors.secureTooltip,
    insecure_registry_mirrors: helptextApps.settingsForm.registryMirrors.insecureTooltip,
  };

  get mirrorsCount(): number {
    return this.form.value.secure_registry_mirrors.length + this.form.value.insecure_registry_mirrors.length;
  }

  constructor(
    private dockerStore: DockerStore,
    private api: ApiService,
    public slideInRef: SlideInRef<undefined, boolean>,
    private errorHandler: FormErrorHandlerService,
    private fb: FormBuilder,
    private snackbar: SnackbarService,
    private translate: TranslateService,
  ) {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });
    this.dockerStore.initialize();
  }

  ngOnInit(): void {
    this.setupForm();
  }

  setupForm(): void {
    combineLatest([
      this.api.call('catalog.config'),
      this.dockerStore.dockerConfig$.pipe(filter(Boolean), take(1)),
    ])
      .pipe(untilDestroyed(this))
      .subscribe(([catalogConfig, dockerConfig]) => {
        dockerConfig.address_pools.forEach(() => {
          this.addAddressPool();
        });

        this.form.patchValue({
          preferred_trains: catalogConfig.preferred_trains,
          enable_image_updates: dockerConfig.enable_image_updates,
          address_pools: dockerConfig.address_pools,
          nvidia: dockerConfig.nvidia,
          secure_registry_mirrors: dockerConfig.secure_registry_mirrors || [],
          insecure_registry_mirrors: dockerConfig.insecure_registry_mirrors || [],
        });
      });
  }

  protected addAddressPool(): void {
    const control = this.fb.nonNullable.group({
      base: ['', [Validators.required, ipv4or6cidrValidator()]],
      size: [null as number | null, [Validators.required]],
    });

    this.form.controls.address_pools.push(control);
  }

  protected removeAddressPool(index: number): void {
    this.form.controls.address_pools.removeAt(index);
  }

  protected onSubmit(): void {
    const values = this.form.getRawValue();

    this.isFormLoading.set(true);
    forkJoin([
      this.api.call('catalog.update', [{ preferred_trains: values.preferred_trains } as CatalogUpdate]),
      this.api.job('docker.update', [{
        enable_image_updates: values.enable_image_updates,
        address_pools: values.address_pools,
        nvidia: Boolean(values.nvidia),
        secure_registry_mirrors: values.secure_registry_mirrors,
        insecure_registry_mirrors: values.insecure_registry_mirrors,
      }]),
    ])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.isFormLoading.set(false);
          this.snackbar.success(this.translate.instant('Settings saved'));
          this.slideInRef.close({ response: true });
        },
        error: (error: unknown) => {
          this.isFormLoading.set(false);
          this.errorHandler.handleValidationErrors(error, this.form);
        },
      });
  }

  protected readonly helptext = helptextApps;
}
