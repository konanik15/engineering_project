import {Component, Input, OnInit} from '@angular/core';
import {CardDTO, GameDTO, HandDTO, TransferDTO, UnoMessageDTO, UnoMetaDTO} from "../../utils/dto";
import {OAuthService} from "angular-oauth2-oidc";
import {UnoService} from "./uno-service";


//TODO Create abstract table component
@Component({
  selector: 'app-uno-table',
  templateUrl: './uno-table.component.html',
  styleUrls: ['./uno-table.component.css']
})
export class UnoTableComponent implements OnInit {
  @Input() gameSocket: any;
  @Input() game?: GameDTO;
  @Input() gameId!: string

  playerHand!: HandDTO;
  enemiesHands: HandDTO[] = [];

  username: string = "";
  yourTurn: boolean = false;
  cardsAcquiredInThisTurn: CardDTO[] = [];

  selectedCards: Set<CardDTO> = new Set();

  constructor(private oAuthService: OAuthService,
              private unoService: UnoService) {
  }

  ngOnInit(): void {
    const userClaims: any = this.oAuthService.getIdentityClaims();
    this.username = userClaims.family_name ? userClaims.family_name : "Anonim";

    this.updateGame(<GameDTO>this.game)


    if (this.game?.state?.hands) {
      this.setPlayerHand(this.game.state.hands)
      this.setEnemiesHands(this.game.state.hands)
    }
    if (this.game?.meta) {
      this.determineIfItsYourTurn(this.game.meta)
    }

    this.gameSocket.subscribe(
      // @ts-ignore
      msg => this.handleMessage(msg),
      // @ts-ignore // TODO Better error handling ;)
      err => console.log(err),
      () => console.log('Closing WS connection to Lobby')
    )
  }


  private handleMessage(message: any) {
    switch (message.event) {

      case "gameUpdated":
        console.log('game updated: ', message)
        this.updateGame(message.data.game)
        break
      case "playerJoined":
      case "newMessage":
      case "playerReady":
      case "playerUnready":
      case "joinResult":
      case "gameEnded":
      case "startGameResult":
      case "readyResult":
        console.log("Handling ws message from GameService", (message.event))
        break;

      default: {
        console.log("Wrong message type:", message.event)
        break;
      }
    }
  }

  private setPlayerHand(hands: HandDTO[]) {
    this.playerHand = <HandDTO>hands.find(hand => {
      return hand.owner === this.username;
    })
  }

  private setEnemiesHands(hands: HandDTO[]) {
    this.enemiesHands = []
    hands.forEach(hand => {
      if (hand.owner !== this.username && hand) {
        this.enemiesHands.push(hand)
      }
    })
  }

  private determineIfItsYourTurn(meta: UnoMetaDTO) {
    this.yourTurn = meta.turn.username === this.username;
  }

  skipTurn() {
    let unoMessageDTO: UnoMessageDTO = {
      "type": "skip"
    }

    this.unoService.skipTurn(unoMessageDTO, this.gameId).subscribe({
        complete: () => {
        },
        next: (response: any) => {
        },
        error: () => {
          console.log('Smth went wrong with skipping turn')
        }
      }
    )
    console.log('skipping turn!', this.gameSocket)
  }

  sayUno() {
    console.log('uno!')
  }

  accuse() {
    console.log('accuse!')
  }

  drewCard() {
    let cardAmount = 1
    let transferDTO: TransferDTO = {

      "type": "transfer",
      "source": {
        "type": "stack",
        "name": "draw"
      },
      "destination": {
        "type": "hand",
      },
      "amount": cardAmount

    }
    this.unoService.transfer(transferDTO, this.gameId).subscribe({
        complete: () => {
        },
        next: (response: any) => {
        },
        error: () => {
          console.log('Smth went wrong with transfer cards')
        }
      }
    )
  }

  private updateGame(game: GameDTO) {
    this.game = game

    if (this.game?.state?.hands) {
      this.setPlayerHand(this.game.state.hands)
      this.setEnemiesHands(this.game.state.hands)
    }
    if (this.game?.meta) {
      this.determineIfItsYourTurn(this.game.meta)
    }

  }

  playCard() {
    let transferDTOs: TransferDTO[] = []
    this.selectedCards.forEach(card => {
      console.log('playing card:', card)
      transferDTOs.push({
        "type": "transfer",
        "source": {
          "type": "hand"
        },
        "destination": {
          "type": "pile",
          "name": "discard"
        },
        "cards": [card]
      })
    })
    this.unoService.transfer(transferDTOs, this.gameId).subscribe({
        complete: () => {
        },
        next: (response: any) => {
        },
        error: () => {
          console.log('Smth went wrong with transfer cards')
        }
      }
    )
  }

  readValueFromHand(value: Set<CardDTO>) {
    this.selectedCards = value;
  }
}
