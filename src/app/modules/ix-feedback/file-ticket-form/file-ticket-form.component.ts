import {
  Component,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import _ from 'lodash';
import {
  of, Observable, EMPTY,
} from 'rxjs';
import {
  filter, map, switchMap, debounceTime, catchError,
} from 'rxjs/operators';
import { ticketTypeLabels } from 'app/enums/file-ticket.enum';
import { mapToOptions } from 'app/helpers/options.helper';
import { helptextSystemSupport as helptext } from 'app/helptext/system/support';
import { Option } from 'app/interfaces/option.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import {
  CreateNewTicket,
} from 'app/modules/ix-feedback/interfaces/file-ticket.interface';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './file-ticket-form.component.html',
})
export class FileTicketFormComponent {
  form = this.fb.group({
    token: ['', [Validators.required]],
    category: ['', [Validators.required]],
    title: ['', Validators.required],
  });

  readonly categoryOptions$: Observable<Option[]> = this.getCategories();
  readonly typeOptions$ = of(mapToOptions(ticketTypeLabels, this.translate));
  readonly tooltips = {
    token: helptext.token.tooltip,
    category: helptext.category.tooltip,
    title: helptext.title.tooltip,
  };

  constructor(
    private ws: WebSocketService,
    private fb: FormBuilder,
    private translate: TranslateService,
    private sysGeneralService: SystemGeneralService,
    private errorHandler: FormErrorHandlerService,
  ) {
    this.restoreToken();
    this.addFormListeners();
  }

  private addFormListeners(): void {
    this.form.controls.token.valueChanges.pipe(
      filter((token) => !!token),
      untilDestroyed(this),
    ).subscribe((token) => {
      this.sysGeneralService.setTokenForJira(token);
    });
  }

  private getCategories(): Observable<Option[]> {
    return this.form.controls.token.valueChanges.pipe(
      filter((token) => !!token),
      debounceTime(300),
      switchMap((token) => this.ws.call('support.fetch_categories', [token])),
      map((choices) => Object.entries(choices).map(([label, value]) => ({ label, value }))),
      map((options) => _.sortBy(options, ['label'])),
      catchError((error: WebsocketError) => {
        this.errorHandler.handleWsFormError(error, this.form);

        return EMPTY;
      }),
    );
  }

  private restoreToken(): void {
    const token = this.sysGeneralService.getTokenForJira();
    if (token) {
      this.form.patchValue({ token });
    }
  }

  getPayload(): Partial<CreateNewTicket> {
    const values = this.form.value;

    return {
      category: values.category,
      title: values.title,
      token: values.token,
    };
  }
}
