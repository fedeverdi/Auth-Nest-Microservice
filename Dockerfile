# Usa un'immagine di base per Node.js
FROM node:20

# Imposta la directory di lavoro
WORKDIR /app

# Copia il file package.json e installa le dipendenze
COPY package.json .
RUN npm install

# Copia il resto del codice sorgente
COPY . .

# Compila il codice TypeScript
RUN npm run build

# Espone la porta (ad esempio, 3000)
EXPOSE 3000

# Avvia il servizio
CMD ["npm", "run", "start:prod"]
