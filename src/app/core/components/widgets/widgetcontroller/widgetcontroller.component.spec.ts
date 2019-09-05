import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WidgetcontrollerComponent } from './widgetcontroller.component';

describe('WidgetcontrollerComponent', () => {
  let component: WidgetcontrollerComponent;
  let fixture: ComponentFixture<WidgetcontrollerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WidgetcontrollerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WidgetcontrollerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
