FROM node:18-alpine

# Criar diretório da aplicação
WORKDIR /app

# Copiar package.json e instalar dependências
COPY package.json ./
RUN npm install

# Copiar código da aplicação
COPY . .

# Expor porta 3000
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["node", "index.js"]
