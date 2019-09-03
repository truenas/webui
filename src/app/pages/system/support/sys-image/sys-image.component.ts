import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-sys-image',
  templateUrl: './sys-image.component.html'
})
export class SysImageComponent  {
  @Input() product_image: string;

  constructor() { }

}
