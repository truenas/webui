import {
  ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators,
} from '@angular/forms';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnButtonComponent, TnCheckboxComponent, TnFormFieldComponent, TnFormSectionComponent,
} from '@truenas/ui-components';
import {
  combineLatest,
  filter,
  forkJoin,
  take,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { singleArrayToOptions } from 'app/helpers/operators/options.operators';
import { helptextApps } from 'app/helptext/apps/apps';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxCheckboxListComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox-list/ix-checkbox-list.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxIpInputWithNetmaskComponent } from 'app/modules/forms/ix-forms/components/ix-ip-input-with-netmask/ix-ip-input-with-netmask.component';
import { IxListItemComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list-item/ix-list-item.component';
import { IxListComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ipv4or6cidrValidator } from 'app/modules/forms/ix-forms/validators/ip-validation';
import { UrlValidationService } from 'app/modules/forms/ix-forms/validators/url-validation.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { DockerStore } from 'app/pages/apps/store/docker.store';
import { AppState } from 'app/store';
import { advancedConfigUpdated } from 'app/store/system-config/system-config.actions';

@Component({
  selector: 'ix-apps-settings',
  templateUrl: './apps-settings.component.html',
  styleUrls: ['./apps-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    ModalHeaderComponent,
    TnFormSectionComponent,
    IxCheckboxListComponent,
    IxListItemComponent,
    IxListComponent,
    IxIpInputWithNetmaskComponent,
    IxInputComponent,
    IxCheckboxComponent,
    FormActionsComponent,
    TnButtonComponent,
    TnCheckboxComponent,
    TnFormFieldComponent,
    RequiresRolesDirective,
    TranslateModule,
  ],
  providers: [
    DockerStore,
  ],
})
export class AppsSettingsComponent extends SidePanelForm implements OnInit {
  private dockerStore = inject(DockerStore);
  private api = inject(ApiService);
  private store$ = inject<Store<AppState>>(Store);
  private errorHandler = inject(FormErrorHandlerService);
  private fb = inject(FormBuilder);
  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);
  private urlValidationService = inject(UrlValidationService);
  private destroyRef = inject(DestroyRef);

  readonly isFormLoading = signal(false);
  protected showNvidiaCheckbox = signal(false);
  readonly requiredRoles = [Role.AppsWrite, Role.CatalogWrite];

  protected readonly form = this.fb.nonNullable.group({
    preferred_trains: [[] as string[], Validators.required],
    nvidia: [false],
    enable_image_updates: [true],
    address_pools: new FormArray<FormGroup<{
      base: FormControl<string>;
      size: FormControl<number | null>;
    }>>([]),
    registry_mirrors: new FormArray<FormGroup<{
      url: FormControl<string>;
      insecure: FormControl<boolean>;
    }>>([]),
  });

  /** Public signal hosts can read to disable a Save action while invalid or loading. */
  readonly canSubmit = this.trackCanSubmit(this.isFormLoading);

  protected allTrains$ = this.api.call('catalog.trains').pipe(
    singleArrayToOptions(),
  );

  readonly tooltips = {
    preferred_trains: helptextApps.settingsForm.preferredTrains.tooltip,
    install_nvidia_driver: helptextApps.settingsForm.installNvidiaDriver.tooltip,
    registry_mirrors: helptextApps.settingsForm.registryMirrors.generalTooltip,
  };

  get mirrorsCount(): number {
    return this.form.controls.registry_mirrors.length;
  }

  constructor() {
    super();
    this.dockerStore.initialize();
  }

  ngOnInit(): void {
    this.setupForm();
  }

  setupForm(): void {
    combineLatest([
      this.api.call('catalog.config'),
      this.dockerStore.dockerConfig$.pipe(filter(Boolean), take(1)),
      this.api.call('system.advanced.nvidia_present'),
      this.api.call('system.advanced.config'),
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([catalogConfig, dockerConfig, hasNvidiaCard, advancedConfig]) => {
        this.showNvidiaCheckbox.set(hasNvidiaCard || advancedConfig.nvidia);

        dockerConfig.address_pools.forEach(() => {
          this.addAddressPool();
        });

        // Populate registry_mirrors from the new format if available
        if (dockerConfig.registry_mirrors) {
          dockerConfig.registry_mirrors.forEach(() => {
            this.addRegistryMirror();
          });
        }

        this.form.patchValue({
          preferred_trains: catalogConfig.preferred_trains,
          nvidia: advancedConfig.nvidia,
          enable_image_updates: dockerConfig.enable_image_updates,
          address_pools: dockerConfig.address_pools,
          registry_mirrors: dockerConfig.registry_mirrors || [],
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

  protected addRegistryMirror(): void {
    const control = this.fb.nonNullable.group({
      url: ['', [
        Validators.required,
        Validators.pattern(this.urlValidationService.urlRegex),
      ]],
      insecure: [false],
    });

    this.form.controls.registry_mirrors.push(control);
  }

  protected removeRegistryMirror(index: number): void {
    this.form.controls.registry_mirrors.removeAt(index);
  }

  protected onSubmit(): void {
    const values = this.form.getRawValue();

    this.isFormLoading.set(true);
    forkJoin([
      this.api.call('catalog.update', [{ preferred_trains: values.preferred_trains }]),
      this.api.job('docker.update', [{
        enable_image_updates: values.enable_image_updates,
        address_pools: values.address_pools,
        registry_mirrors: values.registry_mirrors,
      }]),
      ...(this.showNvidiaCheckbox()
        ? [this.api.call('system.advanced.update', [{ nvidia: values.nvidia }])]
        : []),
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isFormLoading.set(false);
          if (this.showNvidiaCheckbox()) {
            this.store$.dispatch(advancedConfigUpdated());
          }
          this.snackbar.success(this.translate.instant('Settings saved'));
          this.close(true);
        },
        error: (error: unknown) => {
          this.isFormLoading.set(false);
          this.errorHandler.handleValidationErrors(error, this.form);
        },
      });
  }

  protected readonly helptext = helptextApps;
}
