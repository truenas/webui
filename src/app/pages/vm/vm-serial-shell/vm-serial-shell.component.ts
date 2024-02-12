import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable, Subscriber } from 'rxjs';
import { TerminalConfiguration, TerminalConnectionData } from 'app/interfaces/terminal.interface';

@UntilDestroy()
@Component({
  template: '<ix-terminal [conf]="this"></ix-terminal>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VmSerialShellComponent implements TerminalConfiguration {
  protected pk: string;

  get connectionData(): TerminalConnectionData {
    return {
      vmId: Number(this.pk),
    };
  }

  constructor(
    private aroute: ActivatedRoute,
  ) {}

  preInit(): Observable<void> {
    return new Observable<void>((subscriber: Subscriber<void>) => {
      this.aroute.params.pipe(untilDestroyed(this)).subscribe((params) => {
        this.pk = params['pk'] as string;
        subscriber.next();
      });
    });
  }
}
