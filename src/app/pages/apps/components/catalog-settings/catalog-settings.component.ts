import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { helptextApps } from 'app/helptext/apps/apps';
import { Catalog, CatalogUpdate } from 'app/interfaces/catalog.interface';
import { IxSlideInRef } from 'app/modules/forms/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-catalog-settings',
  templateUrl: './catalog-settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogSettingsComponent implements OnInit {
  isFormLoading = false;

  form = this.fb.group({
    label: ['', Validators.required],
    preferred_trains: [[] as string[], Validators.required],
  });

  readonly tooltips = {
    label: helptextApps.catalogForm.name.tooltip,
    preferred_trains: helptextApps.catalogForm.preferredTrains.tooltip,
  };

  constructor(
    private ws: WebSocketService,
    private slideInRef: IxSlideInRef<CatalogSettingsComponent>,
    private errorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
  ) {}

  ngOnInit(): void {
    this.form.controls.label.disable();
    this.setupForm();
  }

  setupForm(): void {
    this.ws.call('catalog.config').pipe(
      untilDestroyed(this),
    ).subscribe({
      next: (config: Catalog) => {
        this.form.patchValue({
          label: config.label,
          preferred_trains: config.preferred_trains,
        });
      },
    });
  }

  onSubmit(): void {
    const { preferred_trains: preferredTrains } = this.form.value;

    this.isFormLoading = true;
    this.ws.call('catalog.update', [{ preferred_trains: preferredTrains } as CatalogUpdate])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.isFormLoading = false;
          this.cdr.markForCheck();
          this.slideInRef.close(true);
        },
        error: (error: unknown) => {
          this.isFormLoading = false;
          this.errorHandler.handleWsFormError(error, this.form);
          this.cdr.markForCheck();
        },
      });
  }
}
