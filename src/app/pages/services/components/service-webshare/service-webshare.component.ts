import {
  ChangeDetectionStrategy, Component, OnInit, signal,
} from '@angular/core';
import { ReactiveFormsModule, NonNullableFormBuilder } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { map } from 'rxjs/operators';
import { Role } from 'app/enums/role.enum';
import { helptextServiceWebshare } from 'app/helptext/services/components/service-webshare';
import { WebShareConfig } from 'app/interfaces/webshare-config.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { ChipsProvider } from 'app/modules/forms/ix-forms/components/ix-chips/chips-provider';
import { IxChipsComponent } from 'app/modules/forms/ix-forms/components/ix-chips/ix-chips.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { UserService } from 'app/services/user.service';

@UntilDestroy()
@Component({
  selector: 'ix-service-webshare',
  templateUrl: './service-webshare.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxCheckboxComponent,
    IxChipsComponent,
    IxSelectComponent,
    FormActionsComponent,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class ServiceWebshareComponent implements OnInit {
  protected readonly requiredRoles = [Role.SharingWrite];

  protected isFormLoading = signal(false);

  groupProvider: ChipsProvider = (query) => {
    return this.userService.groupQueryDsCache(query).pipe(
      map((groups) => groups.map((group) => group.group)),
    );
  };

  form = this.fb.group({
    search_index_pool: [null as string | null],
    bulk_download_pool: [null as string | null],
    enable_web_terminal: [false],
    allowed_groups: [[] as string[]],
  });

  readonly helptext = helptextServiceWebshare;

  readonly poolOptions$ = this.api.call('pool.query').pipe(
    map((pools) => pools.map((pool) => ({
      label: pool.name,
      value: pool.name,
    }))),
  );

  constructor(
    private api: ApiService,
    private formErrorHandler: FormErrorHandlerService,
    private fb: NonNullableFormBuilder,
    private snackbar: SnackbarService,
    private translate: TranslateService,
    private userService: UserService,
    public slideInRef: SlideInRef<undefined, boolean>,
  ) {}

  ngOnInit(): void {
    this.isFormLoading.set(true);
    this.api.call('webshare.config').pipe(untilDestroyed(this)).subscribe({
      next: (config: WebShareConfig) => {
        this.form.patchValue({
          search_index_pool: config.search_index_pool,
          bulk_download_pool: config.bulk_download_pool,
          enable_web_terminal: config.enable_web_terminal,
          allowed_groups: config.allowed_groups || ['webshare'],
        });
        this.isFormLoading.set(false);
      },
      error: (error: unknown) => {
        this.isFormLoading.set(false);
        this.formErrorHandler.handleValidationErrors(error, this.form);
      },
    });
  }

  onSubmit(): void {
    const values = this.form.value;

    // Always enable search when saving
    const payload = {
      ...values,
      search_enabled: true,
      search_pruning_enabled: true,
    };

    this.isFormLoading.set(true);
    this.api.call('webshare.update', [payload]).pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.isFormLoading.set(false);
        this.snackbar.success(this.translate.instant('Service configuration saved'));
        this.slideInRef.close({ response: true, error: null });
      },
      error: (error: unknown) => {
        this.isFormLoading.set(false);
        this.formErrorHandler.handleValidationErrors(error, this.form);
      },
    });
  }
}
