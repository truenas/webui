import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NormalSelectionComponent } from './normal-selection.component';

describe('NormalSelectionComponent', () => {
  let component: NormalSelectionComponent;
  let fixture: ComponentFixture<NormalSelectionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [NormalSelectionComponent],
    });
    fixture = TestBed.createComponent(NormalSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
