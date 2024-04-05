FROM node:18-alpine

WORKDIR /code

ENV /frontend/node_modules/.bin /code/node_modules/.bin

COPY ./frontend /code

RUN npm install

EXPOSE 5173

CMD ["npm","run","dev","--","--host"]