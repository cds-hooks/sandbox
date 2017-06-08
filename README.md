# Try it out

Live demo at http://cds-hooks.org/sandbox

# Develop it

### Dev environment with docker

1. Install latest (1.9+) `docker-engine` (see
https://docs.docker.com/engine/installation/ubuntulinux/)

2. Install latest (1.5.2+) `docker-compose` (see
https://docs.docker.com/compose/install/)

For me, on Ubuntu 15.10, this meant running:

```
echo "deb https://apt.dockerproject.org/repo ubuntu-wily main" |  sudo tee --append /etc/apt/sources.list.d/docker.list
sudo apt-key adv --keyserver hkp://p80.pool.sks-keyservers.net:80 --recv-keys 58118E89F3A912897C070ADBF76221572C52609D
sudo apt-get update
sudo apt-get install docker-engine pip
sudo pip install docker-compose
```

#### Local dev environment

```
git clone https://github.com/jmandel/cds-hooks-rx-app
cd cds-hooks-rx-app
sudo docker-compose -f docker-compose-dev.yml  up
```

From here, once the server builds and comes online you can edit files in `src`
and see changes automatically reloaded at `http://localhost:8080`

Configuration:

 * To talk to a FHIR server other than http://hooks.smarthealthit.org:9080,
   you can pass a query variable to the HTML page, as in
   `http://localhost:8080?fhirServiceUrl=http://my-fhir-server`

Bring up the whole stack including API server, assuming you're on a host called `morel`:

```
CDS_HOOKS_URL="http://morel:9001" \
FHIR_URL="http://morel:9002/data" \
docker-compose -f docker-compose-dev.yml up
```


### Dev environment sans docker

The simpler story if you're just looking to do local dev is something like:


### Setup

Install `nodejs` 5.3+ and `npm` 3.3+ and then:
```
npm install -g nodemon
git clone https://github.com/jmandel/cds-hooks-rx-app
cd cds-hooks-rx-app
npm install
cd mock-cds-backend
npm install
```

### Run it

Frontend
```
cd cds-hooks-rx-app 
npm run-script dev
```

CDS service
```
cd cds-hooks-rx-app/mock-cds-backend
nodemon index.js
```

# In production

No current support is provided for hosting a production copy of this demo, but briefly:

 * `npm run-script prod` generates static files in `build` that can be hosted
   with any web server

 * TODO: provide a way to configure the frontend server to talk to a different
   "mock services" server (current values are hard-coded)


