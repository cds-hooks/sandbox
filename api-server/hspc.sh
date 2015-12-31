#!/bin/bash

for repo in reference-auth \
            reference-api \
            reference-messaging \
            reference-apps \
            reference-impl \
            bilirubin-app \
            hsp-java-client \
            hsp-tools \
            hsp-examples; do
    git clone --depth 1 https://bitbucket.org/hspconsortium/$repo
done

cp patches/fhir-service-*.xml  ./reference-api/webapp/src/main/webapp/WEB-INF/
#cp patches/reference-api-pom.xml ./reference-api/pom.xml

mvn clean install -f reference-impl/pom.xml
