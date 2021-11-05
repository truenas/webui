import {
  ChangeDetectionStrategy,
  ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { map } from 'rxjs/operators';
import { helptext_system_bootenv } from 'app/helptext/system/boot-env';
import { FormErrorHandlerService } from 'app/pages/common/ix-forms/services/form-error-handler.service';
import { WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'bootpool-replace-form',
  templateUrl: './bootpool-replace-form.component.html',
  styleUrls: ['./bootpool-replace-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BootPoolReplaceFormComponent implements OnInit {
  isFormLoading = false;
  route_success: string[] = ['system', 'boot', 'status'];
  pk: string;

  form = this.fb.group({
    dev: ['', Validators.required],
  });

  dev = {
    fcName: 'dev',
    label: helptext_system_bootenv.replace_name_placeholder,
    options: this.ws.call('disk.get_unused').pipe(
      map((disks) => {
        const options = disks.map((disk) => ({
          label: disk.name,
          value: disk.name,
        }));

        return [
          { label: '-', value: null },
          ...options,
        ];
      }),
    ),
  };

  constructor(
    private fb: FormBuilder,
    protected router: Router,
    protected route: ActivatedRoute,
    protected ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private errorHandler: FormErrorHandlerService,
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(untilDestroyed(this)).subscribe((params) => {
      this.pk = params['pk'];
    });
  }

  onSubmit(): void {
    this.isFormLoading = true;

    const payload = this.pk.substring(5, this.pk.length);
    const { dev } = this.form.value;
    this.ws.call('boot.replace', [payload, dev]).pipe(untilDestroyed(this)).subscribe(() => {
      this.isFormLoading = false;
      this.router.navigate(this.route_success);
    }, (error) => {
      this.isFormLoading = false;
      this.errorHandler.handleWsFormError(error, this.form);
      this.cdr.markForCheck();
    });
  }

  cancel(): void {
    this.router.navigate(this.route_success);
  }
}
