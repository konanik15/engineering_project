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
