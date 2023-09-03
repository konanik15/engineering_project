import {Component, Input, OnInit} from '@angular/core';
import {CardDTO, PileDTO} from "../../../utils/dto";

@Component({
    selector: 'app-durak-discard-pile',
    templateUrl: './durak-discard-pile.component.html',
    styleUrls: ['./durak-discard-pile.component.css']
})
export class DurakDiscardPileComponent implements OnInit {
    @Input() piles?: PileDTO[];
    @Input() orderedColor: string | undefined;

    pilesSize: number = 0;
    cards!: CardDTO[];
    facing: string = "";


    ngOnInit(): void {
        if (this.piles !== undefined) {
            this.pilesSize = this.piles[0].cards.length
            this.cards = this.piles[0].cards
            this.facing = this.piles[0].facing
        }
    }
}
