import {ComponentFixture, TestBed} from '@angular/core/testing';

import {UnoChooseColorModalComponent} from './uno-choose-color-modal.component';

describe('ChooseColorModalComponent', () => {
  let component: UnoChooseColorModalComponent;
  let fixture: ComponentFixture<UnoChooseColorModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UnoChooseColorModalComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(UnoChooseColorModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
