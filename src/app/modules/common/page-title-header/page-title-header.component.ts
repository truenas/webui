import { Component, Input } from '@angular/core';
import { Observable } from 'rxjs';

@Component({
  selector: 'page-title-header',
  templateUrl: './page-title-header.component.html',
  styleUrls: ['./page-title-header.component.scss'],
})
export class PageTitleHeaderComponent {
  @Input() title: Observable<string>;
}
