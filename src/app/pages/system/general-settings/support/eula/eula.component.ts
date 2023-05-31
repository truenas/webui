import { Component, OnInit } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-eula',
  templateUrl: './eula.component.html',
  styleUrls: ['./eula.component.scss'],
})
export class EulaComponent implements OnInit {
  eula: string;

  constructor(private ws: WebSocketService) { }

  ngOnInit(): void {
    this.ws.call('truenas.get_eula').pipe(untilDestroyed(this)).subscribe((eula) => {
      this.eula = eula;
    });
  }
}
