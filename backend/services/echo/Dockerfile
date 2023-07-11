FROM node:18

WORKDIR /docker_app

COPY ./package*.json ./

RUN npm install

COPY ./src .

CMD ["npm", "start"]
