FROM node:5

RUN mkdir -p /app && \
    mkdir -p /tmp/ui && \
    mkdir -p /tmp/service

ADD ./package.json ./npm-shrinkwrap.json /tmp/ui/
ADD ./mock-cds-backend/package.json /tmp/service/

RUN npm install -g nodemon && \
    cd /tmp/ui && npm install && \
    cd /tmp/service && npm install

ADD . /app
WORKDIR /app

RUN mv docker/scripts/* /bin && \
    mv /tmp/ui/node_modules /app && \
    mv /tmp/service/node_modules /app/mock-cds-backend

CMD ["ls", "-l"]
