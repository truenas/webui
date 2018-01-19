import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewchartlineComponent } from './viewchartline.component';

describe('ViewchartlineComponent', () => {
  let component: ViewchartlineComponent;
  let fixture: ComponentFixture<ViewchartlineComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ViewchartlineComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewchartlineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
