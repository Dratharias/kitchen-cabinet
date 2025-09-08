FROM node:20-alpine

# Crée le dossier de travail
WORKDIR /app

# Copier package.json et package-lock.json
COPY package*.json ./

# Installer dépendances
RUN npm ci && npm install -g ts-node-dev 

# Copier tout le projet
COPY . .

# Exposer le port dev de Vite
EXPOSE 5173

# Commande par défaut : lancer Vite en dev
CMD ["npm", "run", "dev"]
