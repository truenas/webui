import {
  ChangeDetectionStrategy,
  ChangeDetectorRef, Component,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import _ from 'lodash';
import { EMPTY, forkJoin, Observable } from 'rxjs';
import {
  catchError, filter, switchMap, tap,
} from 'rxjs/operators';
import { ServiceName } from 'app/enums/service-name.enum';
import { helptextSharingWebdav, shared } from 'app/helptext/sharing';
import { WebDavShare, WebDavShareUpdate } from 'app/interfaces/web-dav-share.interface';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { WebSocketService, DialogService, AppLoaderService } from 'app/services';
import { FilesystemService } from 'app/services/filesystem.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  templateUrl: './webdav-form.component.html',
  styleUrls: ['./webdav-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebdavFormComponent {
  isFormLoading = false;
  confirmSubmit = true;
  private editingWebdav: WebDavShare;

  get title(): string {
    return this.editingWebdav
      ? this.translate.instant('Edit WebDAV')
      : this.translate.instant('Add WebDAV');
  }

  form = this.fb.group({
    name: ['', Validators.required],
    comment: [''],
    path: ['/mnt', Validators.required],
    ro: [false],
    perm: [true],
    enabled: [true],
  });

  readonly labels = {
    name: helptextSharingWebdav.placeholder_name,
    comment: helptextSharingWebdav.placeholder_comment,
    path: helptextSharingWebdav.placeholder_path,
    ro: helptextSharingWebdav.placeholder_ro,
    perm: helptextSharingWebdav.placeholder_perm,
    enabled: helptextSharingWebdav.placeholder_enabled,
  };

  readonly tooltips = {
    name: helptextSharingWebdav.tooltip_name,
    comment: helptextSharingWebdav.tooltip_comment,
    path: helptextSharingWebdav.tooltip_path,
    ro: helptextSharingWebdav.tooltip_ro,
    perm: helptextSharingWebdav.tooltip_perm,
    enabled: helptextSharingWebdav.tooltip_enabled,
  };

  readonly treeNodeProvider = this.filesystemService.getFilesystemNodeProvider({ directoriesOnly: true });

  constructor(
    private fb: FormBuilder,
    protected ws: WebSocketService,
    private translate: TranslateService,
    private slideInService: IxSlideInService,
    private cdr: ChangeDetectorRef,
    private dialog: DialogService,
    private errorHandler: FormErrorHandlerService,
    private loader: AppLoaderService,
    private filesystemService: FilesystemService,
    private snackbar: SnackbarService,
  ) {
    this.form.controls.perm.valueChanges.pipe(untilDestroyed(this)).subscribe((value: boolean) => {
      this.confirmSubmit = value;
    });
  }

  setWebdavForEdit(webdav: WebDavShare): void {
    this.editingWebdav = webdav;
    this.form.patchValue(webdav);
  }

  onSubmit(): void {
    if (this.confirmSubmit) {
      this.dialog.confirm({
        title: helptextSharingWebdav.warning_dialog_title,
        message: helptextSharingWebdav.warning_dialog_message,
        hideCheckBox: false,
      }).pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
        this.saveConfig();
      });
    } else {
      this.saveConfig();
    }
  }

  saveConfig(): void {
    const values = this.form.value as WebDavShareUpdate;

    this.isFormLoading = true;
    this.cdr.detectChanges();
    let request$: Observable<unknown>;
    if (this.editingWebdav) {
      request$ = this.ws.call('sharing.webdav.update', [
        this.editingWebdav.id,
        values,
      ]);
    } else {
      request$ = this.ws.call('sharing.webdav.create', [values]);
    }

    request$.pipe(
      switchMap(() => this.confirmEnableService()),
      untilDestroyed(this),
    )
      .subscribe({
        complete: () => {
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

  private confirmEnableService(): Observable<unknown> {
    return this.ws.call('service.query', [[]]).pipe(
      switchMap((services) => {
        const service = _.find(services, { service: ServiceName.WebDav });
        if (service.enable) {
          return EMPTY;
        }

        return this.dialog.confirm({
          title: shared.dialog_title,
          message: shared.dialog_message,
          hideCheckBox: true,
          buttonMsg: shared.dialog_button,
        }).pipe(
          filter(Boolean),
          tap(() => this.loader.open()),
          switchMap(() => forkJoin([
            this.ws.call('service.update', [service.id, { enable: true }]),
            this.ws.call('service.start', [service.service, { silent: false }]),
          ])),
          tap(() => {
            this.loader.close();
            this.snackbar.success(
              this.translate.instant('The {service} service has been enabled.', { service: 'WebDAV' }),
            );
          }),
          catchError((error) => {
            this.dialog.errorReport(error.error, error.reason, error.trace.formatted);
            return EMPTY;
          }),
        );
      }),
    );
  }
}
