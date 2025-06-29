import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewChild, AfterViewInit,
} from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose,
} from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { EMPTY } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { helptextNetworkConfiguration } from 'app/helptext/network/configuration/configuration';
import { CopyButtonComponent } from 'app/modules/buttons/copy-button/copy-button.component';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { ipv4Validator } from 'app/modules/forms/ix-forms/validators/ip-validation';
import { WithLoadingStateDirective } from 'app/modules/loader/directives/with-loading-state/with-loading-state.directive';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-default-gateway-dialog',
  templateUrl: './default-gateway-dialog.component.html',
  styleUrls: ['./default-gateway-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    WithLoadingStateDirective,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxInputComponent,
    FormActionsComponent,
    MatDialogActions,
    MatButton,
    TestDirective,
    MatDialogClose,
    RequiresRolesDirective,
    TranslateModule,
    CopyButtonComponent,
  ],
})
export class DefaultGatewayDialog implements OnInit, AfterViewInit {
  @ViewChild(IxInputComponent) private gatewayInput: IxInputComponent;
  protected readonly requiredRoles = [Role.NetworkInterfaceWrite];
  protected currentGateway = '';
  private hasUserTyped = false;
  private hasInitialFocus = false;

  form = this.fb.nonNullable.group({
    defaultGateway: [
      '',
      {
        validators: [
          ipv4Validator(),
          Validators.required,
        ],
      },
    ],
  });

  currentGateway$ = this.api.call('network.general.summary').pipe(
    map((summary) => {
      this.currentGateway = summary.default_routes[0] || '';
      return summary;
    }),
    toLoadingState(),
  );

  readonly helptext = helptextNetworkConfiguration;

  constructor(
    private api: ApiService,
    private fb: FormBuilder,
    public cdr: ChangeDetectorRef,
    private dialogRef: MatDialogRef<DefaultGatewayDialog>,
    private errorHandler: ErrorHandlerService,
    private translate: TranslateService,
    private validatorsService: IxValidatorsService,
  ) {}

  ngOnInit(): void {
    this.currentGateway$.pipe(untilDestroyed(this)).subscribe((state) => {
      if (!state.isLoading && state.value && !this.hasUserTyped) {
        const currentGateway = state.value.default_routes[0];
        if (currentGateway) {
          this.form.patchValue({ defaultGateway: currentGateway });
        }
      }
    });
  }

  ngAfterViewInit(): void {
    // Set up focus handler on the actual input element
    setTimeout(() => {
      if (this.gatewayInput?.inputElementRef) {
        const inputElement = this.gatewayInput.inputElementRef()?.nativeElement;
        if (inputElement) {
          inputElement.addEventListener('focus', () => {
            if (!this.hasInitialFocus && !this.hasUserTyped
              && this.form.controls.defaultGateway.value === this.currentGateway) {
              this.hasInitialFocus = true;
              // Use setTimeout to ensure the value is cleared after Angular's change detection
              setTimeout(() => {
                this.form.patchValue({ defaultGateway: '' });
                this.cdr.markForCheck();
              });
            }
          });
        }
      }
    });
  }

  onInputFocus(): void {
    // This method is kept for compatibility but the actual logic is in ngAfterViewInit
  }

  onInputChange(): void {
    this.hasUserTyped = true;
  }

  onSubmit(): void {
    this.dialogRef.close();
    const formValues = this.form.getRawValue();
    this.api.call('interface.save_default_route', [formValues.defaultGateway]).pipe(
      catchError((error: unknown) => {
        this.errorHandler.showErrorModal(error);
        return EMPTY;
      }),
      untilDestroyed(this),
    ).subscribe();
  }
}
