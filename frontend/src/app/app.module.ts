import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {NavbarComponent} from './components/navbar/navbar.component';
import {LobbyComponent} from './components/lobby/lobby.component';
import {WelcomeComponent} from './components/welcome/welcome.component';
import {HTTP_INTERCEPTORS, HttpClientModule} from "@angular/common/http";
import {OAuthModule} from "angular-oauth2-oidc";
import {AuthInterceptor} from "./AuthInterceptor";
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MatTableModule} from "@angular/material/table";
import {ReactiveFormsModule} from "@angular/forms";
import {MatSortModule} from "@angular/material/sort";
import {JoinLobbyModalComponent} from "./components/lobby/join-lobby-modal/join-lobby-modal.component";
import {MatDialog, MatDialogRef} from "@angular/material/dialog";

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    LobbyComponent,
    WelcomeComponent,
    JoinLobbyModalComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    OAuthModule.forRoot(),
    AppRoutingModule,
    BrowserAnimationsModule,
    MatTableModule,
    ReactiveFormsModule,
    MatSortModule,

  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    {
      provide: MatDialogRef,
      useValue: {}
    },
    {
      provide: MatDialog,
      useValue: {}
    },
  ],

  bootstrap: [AppComponent]
})
export class AppModule {
}
