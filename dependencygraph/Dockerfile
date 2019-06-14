FROM node:8

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5555
CMD [ "npm", "start" ]
