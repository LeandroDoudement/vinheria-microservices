FROM node:18-alpine

# Criar diretório da aplicação
WORKDIR /app

# Copiar package.json e instalar dependências
COPY package.json ./
RUN npm install

# Copiar código da aplicação
COPY . .

# Expor porta 3001
EXPOSE 3001

# Comando para iniciar a aplicação
CMD ["node", "index.js"]
