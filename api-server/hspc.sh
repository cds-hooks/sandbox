#!/bin/bash

for repo in reference-auth \
            reference-api \
            reference-messaging \
            reference-apps \
            reference-impl \
            bilirubin-app \
            java-client \
            tools \
            examples; do
    git clone -b develop --depth 1 https://bitbucket.org/hspconsortium/$repo
done

mvn install -f reference-impl/pom.xml


