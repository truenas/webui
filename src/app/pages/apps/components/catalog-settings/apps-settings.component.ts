import {
  ChangeDetectionStrategy, Component, OnInit, signal,
} from '@angular/core';
import {
  FormArray, FormBuilder, FormControl, FormGroup, Validators,
} from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  async,
  combineLatest, filter, forkJoin, switchMap,
  take,
} from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { singleArrayToOptions } from 'app/helpers/operators/options.operators';
import { helptextApps } from 'app/helptext/apps/apps';
import { CatalogUpdate } from 'app/interfaces/catalog.interface';
import { IxSlideInRef } from 'app/modules/forms/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ipv4or6cidrValidator } from 'app/modules/forms/ix-forms/validators/ip-validation';
import { AppsStore } from 'app/pages/apps/store/apps-store.service';
import { DockerStore } from 'app/pages/apps/store/docker.store';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-apps-settings',
  templateUrl: './apps-settings.component.html',
  styleUrls: ['./apps-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppsSettingsComponent implements OnInit {
  protected hasNvidiaCard$ = this.ws.call('docker.nvidia_present');
  protected isFormLoading = signal(false);
  protected readonly requiredRoles = [Role.AppsWrite, Role.CatalogWrite];

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

  readonly tooltips = {
    preferred_trains: helptextApps.catalogForm.preferredTrains.tooltip,
    install_nvidia_driver: helptextApps.catalogForm.installNvidiaDriver.tooltip,
  };

  constructor(
    private dockerStore: DockerStore,
    private ws: WebSocketService,
    private slideInRef: IxSlideInRef<AppsSettingsComponent>,
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
          nvidia: dockerConfig.nvidia,
        });
      });
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
        nvidia: values.nvidia,
      }]),
    ])
      .pipe(
        switchMap(() => forkJoin([
          this.dockerStore.reloadDockerConfig(),
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
  protected readonly async = async;
}
