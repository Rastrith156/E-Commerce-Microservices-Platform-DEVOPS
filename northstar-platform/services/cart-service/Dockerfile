# syntax=docker/dockerfile:1.7
FROM maven:3.9.9-eclipse-temurin-21-alpine AS build
WORKDIR /workspace
COPY pom.xml .
COPY maven-settings.xml /workspace/maven-settings.xml
RUN --mount=type=cache,id=ecommerce-cart-service-maven,target=/root/.m2/repository,sharing=locked \
    mvn -s maven-settings.xml -B -ntp -C -Dmaven.wagon.http.retryHandler.count=5 -Dmaven.wagon.rto=30000 dependency:go-offline
COPY src ./src
RUN --mount=type=cache,id=ecommerce-cart-service-maven,target=/root/.m2/repository,sharing=locked \
    mvn -s maven-settings.xml -B -ntp -C -Dmaven.wagon.http.retryHandler.count=5 -Dmaven.wagon.rto=30000 -DskipTests package

FROM eclipse-temurin:21-jre-alpine AS runtime
RUN apk upgrade --no-cache \
    && addgroup -S -g 10001 app \
    && adduser -S -D -H -u 10001 -G app app \
    && mkdir /app \
    && chown app:app /app
WORKDIR /app
COPY --from=build --chown=10001:10001 /workspace/target/*.jar /app/app.jar
USER 10001:10001
EXPOSE 8082
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "-Djava.io.tmpdir=/tmp", "-jar", "/app/app.jar"]
