import { Component, Input } from '@angular/core';

@Component({
  selector: 'ix-disk-info',
  templateUrl: './disk-info.component.html',
  styleUrls: ['./disk-info.component.scss'],
})
export class DiskInfoComponent {
    @Input() slot: string;
    @Input() type: string;
    @Input() model: string;
    @Input() serial: string;
}
