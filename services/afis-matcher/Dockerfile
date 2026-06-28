FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn -q -DskipTests package

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/afis-matcher.jar ./afis-matcher.jar
EXPOSE 8080
ENV PORT=8080
CMD ["java", "-jar", "afis-matcher.jar"]
