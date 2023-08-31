import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnoDiscardPileComponent } from './uno-discard-pile.component';

describe('UnoDiscardPileComponent', () => {
  let component: UnoDiscardPileComponent;
  let fixture: ComponentFixture<UnoDiscardPileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UnoDiscardPileComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UnoDiscardPileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
