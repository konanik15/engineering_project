FROM node:latest as build


WORKDIR /docker_app

COPY ./package*.json ./

RUN npm install

COPY . .

CMD ["npm", "start"]


##stage 1
#FROM node:latest as node
#WORKDIR /app
#COPY . .
#RUN npm install
#RUN npm run build --prod#stage 2
#FROM nginx:alpine
#COPY --from=node /app/dist/demo-app /usr/share/nginx/html
