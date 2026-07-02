# syntax=docker/dockerfile:1

# --- Étape 1 : build de l'application React/Vite ---
FROM node:22-alpine AS build
WORKDIR /app

# Installation déterministe des dépendances
COPY package.json package-lock.json ./
RUN npm ci

# Compilation TypeScript + build de production Vite (=> dossier dist/)
COPY . .
RUN npm run build

# --- Étape 2 : image finale servie par Nginx ---
FROM nginx:1.27-alpine AS runtime

# Configuration Nginx adaptée à une SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copie des fichiers statiques compilés
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
