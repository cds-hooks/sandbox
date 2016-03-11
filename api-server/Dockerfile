FROM java:8
RUN apt-get update && apt-get install -y maven
RUN update-alternatives --set java /usr/lib/jvm/java-8-openjdk-amd64/jre/bin/java

WORKDIR /hspc
RUN curl http://central.maven.org/maven2/org/eclipse/jetty/jetty-runner/9.3.6.v20151106/jetty-runner-9.3.6.v20151106.jar -o jetty-runner.jar

WORKDIR /hspc-build
COPY hspc.sh /hspc-build/hspc.sh
RUN ./hspc.sh
RUN mvn install -f reference-impl/pom.xml

COPY hspc-config.sh /hspc-build/hspc-config.sh
COPY patches /hspc-build/patches
RUN ./hspc-config.sh

WORKDIR /hspc
RUN  find /hspc-build -name *.war -print0  | xargs -I{} -0 cp -v {} /hspc

ADD scripts /bin/
CMD api-server
