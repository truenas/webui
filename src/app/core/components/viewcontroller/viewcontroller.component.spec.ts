import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewControllerComponent } from './view-controller.component';

describe('ViewControllerComponent', () => {
  let component: ViewControllerComponent;
  let fixture: ComponentFixture<ViewControllerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ViewControllerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewControllerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
