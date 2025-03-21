import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {NavbarComponent} from './components/navbar/navbar.component';
import {LobbiesComponent} from './components/lobbies/lobbies.component';
import {WelcomeComponent} from './components/welcome/welcome.component';
import {HTTP_INTERCEPTORS, HttpClientModule} from "@angular/common/http";
import {OAuthModule} from "angular-oauth2-oidc";
import {AuthInterceptor} from "./AuthInterceptor";
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MdbModalService} from "mdb-angular-ui-kit/modal";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MatSortModule} from "@angular/material/sort";
import {JoinLobbyModalComponent} from "./components/lobbies/join-lobby-modal/join-lobby-modal.component";
import {MatTableModule} from "@angular/material/table";
import {LobbyComponent} from './components/lobby/lobby.component';
import {AvailableGamesComponent} from './components/available-games/available-games.component';
import {CreateLobbyModalComponent} from './components/lobbies/create-lobby-modal/create-lobby-modal.component';
import {ChatComponent} from './components/chat/chat.component';
import {GameComponent} from './components/games/game/game.component';
import {GameTableComponent} from './components/games/table/game-table.component';
import {GameMenuComponent} from './components/games/game-menu/game-menu.component';
import {GameInfoComponent} from './components/games/game-menu/game-info/game-info.component';
import {PlayerListComponent} from './components/games/game-menu/player-list/player-list.component';
import {UnoTableComponent} from './components/games/uno-table/uno-table.component';
import {UnoDrawStackComponent} from './components/games/uno-table/uno-draw-stack/uno-draw-stack.component';
import {UnoDiscardPileComponent} from './components/games/uno-table/uno-discard-pile/uno-discard-pile.component';
import {UnoCardComponent} from './components/games/uno-table/uno-card/uno-card.component';
import {UnoPlayerHandComponent} from './components/games/uno-table/uno-player-hand/uno-player-hand.component';
import {
  UnoOtherPlayerHorizontalHandComponent
} from './components/games/uno-table/uno-other-player-horizontal-hand/uno-other-player-horizontal-hand.component';
import {
  UnoOtherPlayerVerticalHandComponent
} from './components/games/uno-table/uno-other-player-vertical-hand/uno-other-player-vertical-hand.component';
import {PluralizePipe} from "./components/utils/pluralize.pipe";
import {ToastrModule} from 'ngx-toastr';
import {ToastComponent} from './components/utils/toast/toast.component';
import {DurakTableComponent} from './components/games/durak-table/durak-table.component';
import {
    UnoChooseColorModalComponent
} from './components/games/uno-table/uno-choose-color-modal/uno-choose-color-modal.component';
import {ProfileComponent} from './components/profile/profile.component';
import {NgOptimizedImage} from "@angular/common";
import {DurakPlayerHandComponent} from './components/games/durak-table/durak-player-hand/durak-player-hand.component';
import {
    DurakOtherPlayerVerticalHandComponent
} from './components/games/durak-table/durak-other-player-vertical-hand/durak-other-player-vertical-hand.component';
import {
    DurakOtherPlayerHorizontalHandComponent
} from './components/games/durak-table/durak-other-player-horizontal-hand/durak-other-player-horizontal-hand.component';
import {DurakDrawStackComponent} from './components/games/durak-table/durak-draw-stack/durak-draw-stack.component';
import {
    DurakDiscardPileComponent
} from './components/games/durak-table/durak-discard-pile/durak-discard-pile.component';
import {DurakCardComponent} from './components/games/durak-table/durak-card/durak-card.component';

@NgModule({
    declarations: [
        AppComponent,
        NavbarComponent,
        LobbiesComponent,
        WelcomeComponent,
        JoinLobbyModalComponent,
        LobbyComponent,
        AvailableGamesComponent,
    CreateLobbyModalComponent,
    ChatComponent,
    GameComponent,
    GameTableComponent,
    GameMenuComponent,
    GameInfoComponent,
    PlayerListComponent,
    UnoTableComponent,
        UnoDrawStackComponent,
        UnoDiscardPileComponent,
        UnoCardComponent,
        UnoPlayerHandComponent,
        UnoOtherPlayerHorizontalHandComponent,
        UnoOtherPlayerVerticalHandComponent,
        PluralizePipe,
        ToastComponent,
        DurakTableComponent,
        UnoChooseColorModalComponent,
        ProfileComponent,
        DurakPlayerHandComponent,
        DurakOtherPlayerVerticalHandComponent,
        DurakOtherPlayerHorizontalHandComponent,
        DurakDrawStackComponent,
        DurakDiscardPileComponent,
        DurakCardComponent
    ],
  imports: [
    BrowserModule,
    HttpClientModule,
    OAuthModule.forRoot(),
    AppRoutingModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    MatSortModule,
    MatTableModule,
    FormsModule,
    ToastrModule.forRoot({
      positionClass: "toast-bottom-left"

    }),
    NgOptimizedImage
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    {
      provide: MdbModalService,
    }
  ],

  bootstrap: [AppComponent]
})
export class AppModule {
}
