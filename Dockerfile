FROM bigeasy/node:10.4.1
MAINTAINER Alan Gutierrez <alan@prettyrobots.com>

RUN apt-get -y update && apt-get -y upgrade && apt-get install -y jq psmisc dnsutils && mkdir -p /home/bigeasy/addendum

WORKDIR /home/bigeasy/addendum

COPY package*.json .
RUN npm install --no-package-lock --no-save --only=production

COPY *.js README LICENSE ./
