FROM node:lts-alpine
COPY . /opt/bot
WORKDIR /opt/bot
RUN yarn install
COPY settings.json .
CMD [ "yarn", "start" ]