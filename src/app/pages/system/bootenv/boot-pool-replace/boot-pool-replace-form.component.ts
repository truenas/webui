import {
  ChangeDetectionStrategy,
  ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { map } from 'rxjs/operators';
import { helptextSystemBootenv } from 'app/helptext/system/boot-env';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  templateUrl: './boot-pool-replace-form.component.html',
  styleUrls: ['./boot-pool-replace-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BootPoolReplaceFormComponent implements OnInit {
  isFormLoading = false;
  routeSuccess: string[] = ['system', 'boot', 'status'];
  pk: string;

  form = this.fb.group({
    dev: ['', Validators.required],
  });

  dev = {
    fcName: 'dev',
    label: this.translate.instant(helptextSystemBootenv.replace_name_placeholder),
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
    private translate: TranslateService,
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
      this.cdr.markForCheck();
      this.router.navigate(this.routeSuccess);
    }, (error) => {
      this.isFormLoading = false;
      this.errorHandler.handleWsFormError(error, this.form);
      this.cdr.markForCheck();
    });
  }

  cancel(): void {
    this.router.navigate(this.routeSuccess);
  }
}
