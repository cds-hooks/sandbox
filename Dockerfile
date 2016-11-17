FROM node:6

RUN mkdir -p /app && \
    mkdir -p /tmp/ui && \
    mkdir -p /tmp/service

ADD ./package.json ./npm-shrinkwrap.json /tmp/ui/
ADD ./mock-cds-backend/package.json /tmp/service/

RUN npm install -g nodemon
RUN cd /tmp/ui && npm install
RUN cd /tmp/service && npm install

ADD . /app
WORKDIR /app

RUN mv docker/scripts/* /bin && \
    mv /tmp/ui/node_modules /app && \
    mv /tmp/service/node_modules /app/mock-cds-backend

RUN npm install -g http-server

ENV HTTP_PORT_FRONTEND 8080
ENV HTTP_PORT_BACKEND 8081

CMD run-frontend
