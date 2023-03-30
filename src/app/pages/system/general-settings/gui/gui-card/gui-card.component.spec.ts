import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GuiCardComponent } from './gui-card.component';

describe('GuiCardComponent', () => {
  let component: GuiCardComponent;
  let fixture: ComponentFixture<GuiCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GuiCardComponent],
    })
      .compileComponents();

    fixture = TestBed.createComponent(GuiCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
