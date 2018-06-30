FROM node:alpine
MAINTAINER Alan Gutierrez <alan@prettyrobots.com>

RUN apk update && apk upgrade && apk add bash

WORKDIR /home/bigeasy/addendum

COPY package*.json .
RUN npm install --no-package-lock --no-save --only=production

COPY *.js README LICENSE ./
