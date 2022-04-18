import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable } from 'rxjs';
import helptext from 'app/helptext/apps/apps';
import { ChartSchema } from 'app/interfaces/chart-release.interface';
import { DynamicFormSchema } from 'app/interfaces/dynamic-form-schema.interface';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  templateUrl: './chart-form.component.html',
  styleUrls: ['./chart-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartFormComponent {
  title: string;
  name: string;
  isLoading = false;
  dynamicFormSchema: DynamicFormSchema[] = [];

  form = this.formBuilder.group({
    release_name: ['', Validators.required],
  });

  readonly helptext = helptext;

  constructor(
    private formBuilder: FormBuilder,
    private slideInService: IxSlideInService,
    private errorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private ws: WebSocketService,
  ) {}

  setTitle(title: string): void {
    this.title = title;
  }

  parseChartSchema(chartSchema: ChartSchema): void {
    this.form.controls.release_name.setValue(this.title);
    this.form.controls.release_name.disable();
    // TODO: parse chartSchema.schema and patch form
  }

  onSubmit(): void {
    const values = this.form.value;

    this.isLoading = true;
    const request$: Observable<unknown> = this.ws.call('chart.release.update', values);

    request$.pipe(untilDestroyed(this)).subscribe(() => {
      this.isLoading = false;
      this.slideInService.close();
    }, (error) => {
      this.isLoading = false;
      this.errorHandler.handleWsFormError(error, this.form);
      this.cdr.markForCheck();
    });
  }
}
