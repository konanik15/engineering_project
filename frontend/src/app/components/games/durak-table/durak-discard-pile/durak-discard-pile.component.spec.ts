import {ComponentFixture, TestBed} from '@angular/core/testing';

import {DurakDiscardPileComponent} from './durak-discard-pile.component';

describe('DurakDiscardPileComponent', () => {
    let component: DurakDiscardPileComponent;
    let fixture: ComponentFixture<DurakDiscardPileComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DurakDiscardPileComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(DurakDiscardPileComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
