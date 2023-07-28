# Engineering project

This repo is dedicated to realization of engineering thesis. Main theme of thesis is "Web app platform for multiplayer games".
It's focused on card games. One of the main point of this app is to implement modular games to simplify futher addition of other games. 
By implementing main interface "Game Core" and avoid duplication of code for common functionalities like finishing game, entering game etc.

## How to run

* You need docker installed on your machine
* Clone git repo and write `docker-compose up`


## Architecture and description

For app will be devided into 3 services

* coop-app-ui - frontend
* keycloak - authorization mode
* some node js -backend

## Docker config info

* Keycloak is listening on 8080.
* Frontend app is listening on 4200.

## TODO
### Keycloak
- configure sensible session and token expiration times for production later on, now they are practically endless for dev/debug purposes
- figure out how to set client secret so it's not hardcoded in the realm json file
- ~~figure out how to set up a docker healthcheck~~
















//Secret stuff

Pytania w trakcie obrony : 

https://docs.google.com/spreadsheets/d/16BqsEosv_mXLMUo3LlsEEcDf8v3CNQ7iuL9OpIhio2k/edit#gid=

Opracowanie pytań : 

https://docs.google.com/document/d/12-QBBaWRHTkLc_HAKTUZ9rDLj2af-bgOfhgKoiwVVCY/edit#
