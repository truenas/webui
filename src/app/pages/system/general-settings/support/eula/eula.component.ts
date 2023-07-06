import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './eula.component.html',
  styleUrls: ['./eula.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EulaComponent implements OnInit {
  eula: string;

  constructor(
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.ws.call('truenas.get_eula').pipe(untilDestroyed(this)).subscribe((eula) => {
      this.eula = eula;
      this.cdr.markForCheck();
    });
  }
}
