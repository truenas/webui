import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { choicesToOptions } from 'app/helpers/options.helper';
import helptext from 'app/helptext/services/components/service-tftp';
import { TftpConfigUpdate } from 'app/interfaces/tftp-config.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { UserComboboxProvider } from 'app/modules/ix-forms/classes/user-combobox-provider';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { DialogService, UserService, WebSocketService } from 'app/services';
import { FilesystemService } from 'app/services/filesystem.service';

@UntilDestroy()
@Component({
  templateUrl: './service-tftp.component.html',
  styleUrls: ['./service-tftp.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceTftpComponent implements OnInit {
  isFormLoading = false;

  form = this.formBuilder.group({
    directory: [''],
    host: [''],
    port: [null as number],
    username: [''],
    umask: [''],
    newfiles: [false],
    options: [''],
  });

  readonly tooltips = {
    directory: helptext.tftp_directory_tooltip,
    host: helptext.tftp_host_tooltip,
    port: helptext.tftp_port_tooltip,
    username: helptext.tftp_username_tooltip,
    umask: helptext.tftp_umask_tooltip,
    newfiles: helptext.tftp_newfiles_tooltip,
    options: helptext.tftp_options_tooltip,
  };

  readonly userProvider = new UserComboboxProvider(this.userService);
  readonly treeNodeProvider = this.filesystemService.getFilesystemNodeProvider({ directoriesOnly: true });
  readonly hosts$ = this.ws.call('tftp.host_choices').pipe(choicesToOptions());

  constructor(
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private formBuilder: FormBuilder,
    private errorHandler: FormErrorHandlerService,
    private dialogService: DialogService,
    private userService: UserService,
    private filesystemService: FilesystemService,
  ) {}

  ngOnInit(): void {
    this.isFormLoading = true;
    this.ws.call('tftp.config')
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (config) => {
          this.form.patchValue({
            ...config,
            umask: invertUmask(config.umask),
          });
          this.isFormLoading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          new EntityUtils().handleWsError(this, error, this.dialogService);
          this.isFormLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  onSubmit(): void {
    const values = {
      ...this.form.value,
      umask: invertUmask(this.form.value.umask),
    };

    this.isFormLoading = true;
    this.ws.call('tftp.update', [values as TftpConfigUpdate])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.isFormLoading = false;
          this.cdr.markForCheck();
          this.router.navigate(['/services']);
        },
        error: (error) => {
          this.isFormLoading = false;
          this.errorHandler.handleWsFormError(error, this.form);
          this.cdr.markForCheck();
        },
      });
  }
}

/**
 * Need to invert the umask prop on the way in/out.
 * The 'permissions' FieldConfig and the MW expect opposite values.
 */
function invertUmask(umask: string): string {
  const perm = parseInt(umask, 8);
  let mask = (~perm & 0o666).toString(8);
  while (mask.length < 3) {
    mask = '0' + mask;
  }

  return mask;
}
