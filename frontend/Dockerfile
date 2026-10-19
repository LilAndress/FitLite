FROM node:20-alpine

WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm install

# Copiar el código fuente
COPY . .

# Exponer el puerto de Vite
EXPOSE 5174

# Iniciar Vite con soporte para conexiones externas y hot-reload
CMD ["npm", "run", "dev", "--", "--host"]
