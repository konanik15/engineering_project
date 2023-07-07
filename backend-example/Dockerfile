FROM node:latest

WORKDIR /backend-example
COPY package.json .
RUN npm install
COPY . .
CMD npm start