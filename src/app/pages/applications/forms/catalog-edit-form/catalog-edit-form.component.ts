import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable, of } from 'rxjs';
import helptext from 'app/helptext/apps/apps';
import { Catalog, CatalogUpdate } from 'app/interfaces/catalog.interface';
import { Option } from 'app/interfaces/option.interface';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  templateUrl: './catalog-edit-form.component.html',
  styleUrls: ['./catalog-edit-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogEditFormComponent implements OnInit {
  private editingCatalog: Catalog;
  isFormLoading = false;

  form = this.fb.group({
    label: ['', Validators.required],
    preferred_trains: [[] as string[]],
  });

  trainOptions$: Observable<Option[]> = of([]);

  readonly tooltips = {
    label: helptext.catalogForm.name.tooltip,
    preferred_trains: helptext.catalogForm.preferredTrains.tooltip,
  };

  constructor(
    private ws: WebSocketService,
    private slideInService: IxSlideInService,
    private errorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
  ) {}

  ngOnInit(): void {
    this.form.controls['label'].disable();
  }

  setCatalogForEdit(catalog: Catalog): void {
    this.editingCatalog = catalog;
    this.form.patchValue(this.editingCatalog);

    this.trainOptions$ = of(
      Object.keys(catalog.trains).map((train) => ({
        label: train,
        value: train,
      })),
    );
  }

  onSubmit(): void {
    const values = this.form.value;

    this.isFormLoading = true;
    this.ws.call('catalog.update', [this.editingCatalog.id, values as CatalogUpdate])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.isFormLoading = false;
          this.cdr.markForCheck();
          this.slideInService.close();
        },
        error: (error) => {
          this.isFormLoading = false;
          this.errorHandler.handleWsFormError(error, this.form);
          this.cdr.markForCheck();
        },
      });
  }
}
