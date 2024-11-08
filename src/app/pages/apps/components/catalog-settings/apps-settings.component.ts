import {
  ChangeDetectionStrategy, Component, computed, OnInit, signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import {
  combineLatest, filter, forkJoin, of, switchMap,
  take,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { dockerNvidiaStatusLabels } from 'app/enums/docker-nvidia-status.enum';
import { Role } from 'app/enums/role.enum';
import { singleArrayToOptions } from 'app/helpers/operators/options.operators';
import { helptextApps } from 'app/helptext/apps/apps';
import { CatalogUpdate } from 'app/interfaces/catalog.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxCheckboxListComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox-list/ix-checkbox-list.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxIpInputWithNetmaskComponent } from 'app/modules/forms/ix-forms/components/ix-ip-input-with-netmask/ix-ip-input-with-netmask.component';
import { IxListItemComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list-item/ix-list-item.component';
import { IxListComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ipv4or6cidrValidator } from 'app/modules/forms/ix-forms/validators/ip-validation';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { AppsStore } from 'app/pages/apps/store/apps-store.service';
import { DockerStore } from 'app/pages/apps/store/docker.store';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-apps-settings',
  templateUrl: './apps-settings.component.html',
  styleUrls: ['./apps-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ModalHeaderComponent,
    MatCardContent,
    MatCard,
    IxFieldsetComponent,
    IxCheckboxListComponent,
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
    MapValuePipe,
  ],
})
export class AppsSettingsComponent implements OnInit {
  protected hasNvidiaCard = toSignal(this.dockerStore.hasNvidiaCard$);
  protected nvidiaDriversInstalled = toSignal(this.dockerStore.nvidiaDriversInstalled$);
  protected dockerNvidiaStatus = toSignal(this.dockerStore.dockerNvidiaStatus$);
  protected isFormLoading = signal(false);
  protected readonly requiredRoles = [Role.AppsWrite, Role.CatalogWrite];
  protected readonly dockerNvidiaStatusLabels = dockerNvidiaStatusLabels;

  protected form = this.fb.group({
    preferred_trains: [[] as string[], Validators.required],
    nvidia: [null as boolean],
    enable_image_updates: [true],
    address_pools: new FormArray<FormGroup<{
      base: FormControl<string>;
      size: FormControl<number>;
    }>>([]),
  });

  protected allTrains$ = this.ws.call('catalog.trains').pipe(
    singleArrayToOptions(),
  );

  protected showNvidiaCheckbox = computed(() => this.hasNvidiaCard() || this.nvidiaDriversInstalled());

  readonly tooltips = {
    preferred_trains: helptextApps.catalogForm.preferredTrains.tooltip,
    install_nvidia_driver: helptextApps.catalogForm.installNvidiaDriver.tooltip,
  };

  constructor(
    private dockerStore: DockerStore,
    private ws: WebSocketService,
    private slideInRef: SlideInRef<AppsSettingsComponent>,
    private errorHandler: FormErrorHandlerService,
    private fb: FormBuilder,
    private appsStore: AppsStore,
  ) {}

  ngOnInit(): void {
    this.setupForm();
  }

  setupForm(): void {
    combineLatest([
      this.ws.call('catalog.config'),
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
        });
      });

    if (this.nvidiaDriversInstalled()) {
      this.form.patchValue({
        nvidia: this.nvidiaDriversInstalled(),
      });
    }
  }

  addAddressPool(): void {
    const control = this.fb.group({
      base: ['', [Validators.required, ipv4or6cidrValidator()]],
      size: [null as number, [Validators.required]],
    });

    this.form.controls.address_pools.push(control);
  }

  removeAddressPool(index: number): void {
    this.form.controls.address_pools.removeAt(index);
  }

  onSubmit(): void {
    const values = this.form.getRawValue();

    this.isFormLoading.set(true);
    forkJoin([
      this.ws.call('catalog.update', [{ preferred_trains: values.preferred_trains } as CatalogUpdate]),
      this.ws.job('docker.update', [{
        enable_image_updates: values.enable_image_updates,
        address_pools: values.address_pools,
      }]),
    ])
      .pipe(
        switchMap(() => (values.nvidia !== null ? this.dockerStore.setDockerNvidia(values.nvidia) : of(values.nvidia))),
        switchMap(() => forkJoin([
          this.dockerStore.reloadDockerConfig(),
          this.dockerStore.reloadDockerNvidiaStatus(),
          this.appsStore.loadCatalog(),
        ])),
        untilDestroyed(this),
      )
      .subscribe({
        next: () => {
          this.isFormLoading.set(false);
          this.slideInRef.close(true);
        },
        error: (error: unknown) => {
          this.isFormLoading.set(false);
          this.errorHandler.handleWsFormError(error, this.form);
        },
      });
  }

  protected readonly helptext = helptextApps;
}
