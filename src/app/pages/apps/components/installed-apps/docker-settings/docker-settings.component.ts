import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  EMPTY,
} from 'rxjs';
import {
  catchError,
} from 'rxjs/operators';
import { IxSlideInRef } from 'app/modules/forms/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { dockerSettingsElements } from 'app/pages/apps/components/installed-apps/docker-settings/docker-settings.elements';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-docker-settings',
  templateUrl: './kubernetes-settings.component.html',
  styleUrls: ['./kubernetes-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DockerSettingsComponent implements OnInit {
  readonly searchableElements = dockerSettingsElements;

  isFormLoading = false;

  readonly form = this.fb.group({
    enable_container_image_update: [true],
  });

  constructor(
    protected ws: WebSocketService,
    private slideInRef: IxSlideInRef<DockerSettingsComponent>,
    private appService: ApplicationsService,
    private errorHandler: ErrorHandlerService,
    private fb: FormBuilder,
    private formErrorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.loadSettings();
  }

  onSubmit(): void {
    const { enable_container_image_update: enableContainerImageUpdate } = this.form.value;

    this.appService.updateContainerConfig(enableContainerImageUpdate).pipe(
      catchError((error: unknown) => {
        this.formErrorHandler.handleWsFormError(error, this.form);
        return EMPTY;
      }),
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.slideInRef.close();
      },
    });
  }

  private loadSettings(): void {
    this.isFormLoading = true;
    this.appService.getContainerConfig().pipe(untilDestroyed(this)).subscribe({
      next: (containerConfig) => {
        this.form.patchValue({
          enable_container_image_update: containerConfig.enable_image_updates,
        });

        this.isFormLoading = false;
        this.cdr.markForCheck();
      },
      error: (error: unknown) => {
        this.isFormLoading = false;
        this.cdr.markForCheck();
        this.errorHandler.showErrorModal(error);
      },
    });
  }
}
