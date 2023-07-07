# base image
FROM node:latest

# set working directory
WORKDIR /app
# install and cache app dependencies
COPY package.json /app/package.json
RUN npm install
RUN npm install -g @angular/cli@7.3.10

# add app
COPY . /app

# start app
CMD ng serve --host 0.0.0.0
