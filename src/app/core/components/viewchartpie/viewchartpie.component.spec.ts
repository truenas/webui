import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewchartpieComponent } from './viewchartpie.component';

describe('ViewchartpieComponent', () => {
  let component: ViewchartpieComponent;
  let fixture: ComponentFixture<ViewchartpieComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ViewchartpieComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewchartpieComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
