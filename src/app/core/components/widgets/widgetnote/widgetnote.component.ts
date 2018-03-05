import { Component, OnInit, AfterViewInit, Input, ViewChild, Renderer2, ElementRef } from '@angular/core';
import { CoreServiceInjector } from 'app/core/services/coreserviceinjector';
import { Router } from '@angular/router';
//import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { MaterialModule } from 'app/appMaterial.module';
import { AnimationDirective } from 'app/core/directives/animation.directive';
import { WidgetComponent } from 'app/core/components/widgets/widget/widget.component';

@Component({
  selector: 'widget-note',
  templateUrl:'./widgetnote.component.html',
  styleUrls: ['./widgetnote.component.css']
})
export class WidgetNoteComponent extends WidgetComponent implements OnInit, AfterViewInit {

  @Input() noteData:any = "";
  public title = "Note";
  public flipDirection = "horizontal";

  constructor(public router: Router){
    super();
    this.configurable = true;
  }

  ngOnInit(){
  }
  
  ngAfterViewInit(){
    //console.log(this.el.nativeElement.children);
  }

}
