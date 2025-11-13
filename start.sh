#!/bin/bash

# 🍷 Vinheria Agnello - Script de Inicialização
# Desenvolvido para FIAP - Arquitetura de Microserviços

echo "🍷 =========================================="
echo "🍷 Vinheria Agnello - Microservices Setup"
echo "🍷 =========================================="

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não está instalado. Por favor, instale o Docker primeiro."
    exit 1
fi

# Verificar se Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose não está instalado. Por favor, instale o Docker Compose primeiro."
    exit 1
fi

echo "✅ Docker e Docker Compose encontrados"

# Verificar se os certificados existem
if [ ! -f "certs/cert.pem" ] || [ ! -f "certs/key.pem" ]; then
    echo "🔒 Gerando certificados SSL self-signed..."
    mkdir -p certs
    openssl req -x509 -newkey rsa:4096 -keyout certs/key.pem -out certs/cert.pem -days 365 -nodes \
        -subj "/C=BR/ST=SP/L=SaoPaulo/O=VinheriaAgnello/OU=IT/CN=*.vinheria.local"
    echo "✅ Certificados SSL gerados com sucesso"
else
    echo "✅ Certificados SSL já existem"
fi

# Parar containers existentes
echo "🛑 Parando containers existentes..."
docker-compose down 2>/dev/null || true

# Construir e iniciar os serviços
echo "🏗️ Construindo e iniciando os serviços..."
docker-compose up -d --build

# Aguardar serviços ficarem prontos
echo "⏳ Aguardando serviços ficarem prontos..."
sleep 15

# Verificar status dos serviços
echo "📊 Verificando status dos serviços..."
docker-compose ps

# Testar conectividade
echo ""
echo "🧪 Testando conectividade dos serviços..."

# Testar Sales Service
echo "🔍 Testando Sales Service..."
if curl -k -s https://localhost:3000/health > /dev/null; then
    echo "✅ Sales Service está respondendo"
else
    echo "❌ Sales Service não está respondendo"
fi

# Testar Inventory Service
echo "🔍 Testando Inventory Service..."
if curl -k -s https://localhost:3001/health > /dev/null; then
    echo "✅ Inventory Service está respondendo"
else
    echo "❌ Inventory Service não está respondendo"
fi

# Testar DNS
echo "🔍 Testando DNS interno..."
if docker exec vinheria-dns nslookup sales.vinheria.local > /dev/null 2>&1; then
    echo "✅ DNS interno está funcionando"
else
    echo "❌ DNS interno não está funcionando"
fi

echo ""
echo "🎉 =========================================="
echo "🎉 Vinheria Agnello está rodando!"
echo "🎉 =========================================="
echo ""
echo "📋 Informações dos Serviços:"
echo "   🌐 Sales Service:     https://localhost:3000"
echo "   📦 Inventory Service: https://localhost:3001"
echo "   🔍 DNS Service:       172.20.0.2:53"
echo ""
echo "🔧 Comandos úteis:"
echo "   Ver logs:           docker-compose logs -f"
echo "   Parar serviços:     docker-compose down"
echo "   Reiniciar:          docker-compose restart"
echo ""
echo "🧪 Testar JWT:"
echo "   1. Obter token:     curl -k https://localhost:3000/auth"
echo "   2. Usar token:      curl -k -H \"Authorization: Bearer <TOKEN>\" https://localhost:3001/stock"
echo ""
echo "📖 Consulte o README.md para mais informações!"
