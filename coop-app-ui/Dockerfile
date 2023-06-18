FROM node:latest as build

RUN mkdir /usr/src/app
WORKDIR /usr/local/app

RUN npm install -g @angular/cli

COPY ./ /usr/local/app/

CMD ng serve --host 0.0.0.0 --port 4200



