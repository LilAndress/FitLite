# Etapa 1: Compilación
FROM maven:3.9-eclipse-temurin-17-alpine AS build
WORKDIR /app

# Cache de dependencias de Maven
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Compilar proyecto sin ejecutar pruebas unitarias para agilizar el build
COPY src ./src
RUN mvn clean package -DskipTests

# Etapa 2: Imagen ligera de ejecución
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8081

ENTRYPOINT ["java", "-jar", "app.jar"]
