import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnoOtherPlayerHorizontalHandComponent } from './uno-other-player-horizontal-hand.component';

describe('UnoOtherPlayerHorizontalHandComponent', () => {
  let component: UnoOtherPlayerHorizontalHandComponent;
  let fixture: ComponentFixture<UnoOtherPlayerHorizontalHandComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UnoOtherPlayerHorizontalHandComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UnoOtherPlayerHorizontalHandComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
