import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { choicesToOptions } from 'app/helpers/options.helper';
import helptext from 'app/helptext/services/components/service-lldp';
import { Option } from 'app/interfaces/option.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { IxComboboxProvider } from 'app/modules/ix-forms/components/ix-combobox2/ix-combobox-provider';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { WebSocketService, ServicesService, DialogService } from 'app/services';

@UntilDestroy()
@Component({
  templateUrl: './service-lldp.component.html',
  styleUrls: ['./service-lldp.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceLldpComponent implements OnInit {
  isFormLoading = false;

  form = this.fb.group({
    intdesc: [false],
    country: ['', [Validators.required]],
    location: [''],
  });

  intdesc: {
    readonly fcName: 'intdesc';
    label: string;
    tooltip: string;
  } = {
    fcName: 'intdesc',
    label: helptext.lldp_intdesc_placeholder,
    tooltip: helptext.lldp_intdesc_tooltip,
  };

  country: {
    readonly fcName: 'country';
    label: string;
    tooltip: string;
  } = {
    fcName: 'country',
    label: helptext.lldp_country_placeholder,
    tooltip: helptext.lldp_country_tooltip,
  };

  location: {
    readonly fcName: 'location';
    label: string;
    tooltip: string;
  } = {
    fcName: 'location',
    label: helptext.lldp_location_placeholder,
    tooltip: helptext.lldp_location_tooltip,
  };

  readonly locationOptions$ = this.ws.call('lldp.country_choices').pipe(choicesToOptions());

  locationOptions: Option[];
  locationProvider: IxComboboxProvider = {
    fetch: (search: string): Observable<Option[]> => {
      if (this.locationOptions && this.locationOptions.length) {
        return of(this.filter(this.locationOptions, search));
      }
      return this.ws.call('lldp.country_choices')
        .pipe(
          choicesToOptions(),
          tap((options: Option[]) => this.locationOptions = options),
          map((options: Option[]) => this.filter(options, search)),
        );
    },
    nextPage: (): Observable<Option[]> => of([]),
  };

  filter(options: Option[], search: string): Option[] {
    if (options && options.length) {
      if (search) {
        return options.filter((option: Option) => {
          return option.label.toLowerCase().includes(search.toLowerCase())
              || option.value.toString().toLowerCase().includes(search.toLowerCase());
        });
      }
      return [...options];
    }
    return [];
  }

  constructor(
    protected router: Router,
    protected route: ActivatedRoute,
    protected ws: WebSocketService,
    protected services: ServicesService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private dialogService: DialogService,
    private errorHandler: FormErrorHandlerService,
  ) { }

  ngOnInit(): void {
    this.isFormLoading = true;
    this.ws.call('lldp.config').pipe(untilDestroyed(this)).subscribe(
      (config) => {
        this.form.patchValue(config);
        this.isFormLoading = false;
        this.cdr.markForCheck();
      },
      (error) => {
        this.isFormLoading = false;
        new EntityUtils().handleWsError(null, error, this.dialogService);
        this.cdr.markForCheck();
      },
    );
  }

  onSubmit(): void {
    const values = this.form.value;

    this.isFormLoading = true;

    this.ws.call('lldp.update', [values])
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.isFormLoading = false;
        this.router.navigate(['/services']);
        this.cdr.markForCheck();
      }, (error) => {
        this.isFormLoading = false;
        this.errorHandler.handleWsFormError(error, this.form);
        this.cdr.markForCheck();
      });
  }

  onCancel(): void {
    this.router.navigate(['/services']);
  }
}
