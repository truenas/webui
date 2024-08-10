import {
  ChangeDetectionStrategy, Component, OnInit, signal,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { switchMap } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { helptextApps } from 'app/helptext/apps/apps';
import { Catalog, CatalogUpdate } from 'app/interfaces/catalog.interface';
import { IxSlideInRef } from 'app/modules/forms/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { AppsStore } from 'app/pages/apps/store/apps-store.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-catalog-settings',
  templateUrl: './catalog-settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogSettingsComponent implements OnInit {
  protected isFormLoading = signal(false);
  protected readonly requiredRoles = [Role.AppsWrite, Role.CatalogWrite];

  protected form = this.fb.group({
    preferred_trains: [[] as string[], Validators.required],
  });

  readonly tooltips = {
    preferred_trains: helptextApps.catalogForm.preferredTrains.tooltip,
  };

  constructor(
    private ws: WebSocketService,
    private slideInRef: IxSlideInRef<CatalogSettingsComponent>,
    private errorHandler: FormErrorHandlerService,
    private fb: FormBuilder,
    private appsStore: AppsStore,
  ) {}

  ngOnInit(): void {
    this.setupForm();
  }

  setupForm(): void {
    this.ws.call('catalog.config').pipe(
      untilDestroyed(this),
    ).subscribe({
      next: (config: Catalog) => {
        this.form.patchValue({
          preferred_trains: config.preferred_trains,
        });
      },
    });
  }

  onSubmit(): void {
    const { preferred_trains: preferredTrains } = this.form.value;

    this.isFormLoading.set(true);
    this.ws.call('catalog.update', [{ preferred_trains: preferredTrains } as CatalogUpdate])
      .pipe(
        switchMap(() => this.appsStore.loadCatalog()),
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
}
