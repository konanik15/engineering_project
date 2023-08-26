import {Component, Input, OnInit} from '@angular/core';
import {CardDTO, PileDTO} from "../../../utils/dto";

@Component({
  selector: 'app-uno-discard-pile',
  templateUrl: './uno-discard-pile.component.html',
  styleUrls: ['./uno-discard-pile.component.css']
})
export class UnoDiscardPileComponent implements OnInit{
  @Input() piles?: PileDTO[];

  pilesSize :number = 0;
  cards!: CardDTO[];
  facing: string = "";

  ngOnInit(): void {
    if(this.piles !== undefined){
      this.pilesSize = this.piles[0].cards.length
      this.cards = this.piles[0].cards
      this.facing = this.piles[0].facing
    }
  }
}
