#!/bin/bash

# 🍷 Vinheria Agnello - Script de Testes dos Endpoints
# Desenvolvido para FIAP - Arquitetura de Microserviços

echo "🍷 =========================================="
echo "🍷 Vinheria Agnello - Teste de Endpoints"
echo "🍷 =========================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para testar endpoint
test_endpoint() {
    local method=$1
    local url=$2
    local description=$3
    local headers=$4
    local data=$5
    
    echo -e "${BLUE}🔍 Testando: $description${NC}"
    echo -e "${YELLOW}   $method $url${NC}"
    
    if [ "$method" = "GET" ]; then
        if [ -n "$headers" ]; then
            response=$(curl -k -s -w "%{http_code}" -H "$headers" "$url")
        else
            response=$(curl -k -s -w "%{http_code}" "$url")
        fi
    else
        if [ -n "$headers" ] && [ -n "$data" ]; then
            response=$(curl -k -s -w "%{http_code}" -X "$method" -H "$headers" -d "$data" "$url")
        elif [ -n "$data" ]; then
            response=$(curl -k -s -w "%{http_code}" -X "$method" -H "Content-Type: application/json" -d "$data" "$url")
        else
            response=$(curl -k -s -w "%{http_code}" -X "$method" "$url")
        fi
    fi
    
    http_code="${response: -3}"
    body="${response%???}"
    
    if [[ "$http_code" =~ ^2[0-9][0-9]$ ]]; then
        echo -e "${GREEN}   ✅ Status: $http_code${NC}"
        if [ -n "$body" ]; then
            echo "   📄 Response: $body" | head -c 200
            if [ ${#body} -gt 200 ]; then
                echo "..."
            fi
            echo ""
        fi
    else
        echo -e "${RED}   ❌ Status: $http_code${NC}"
        if [ -n "$body" ]; then
            echo "   📄 Error: $body"
        fi
    fi
    echo ""
}

# Verificar se serviços estão rodando
echo "🔍 Verificando se os serviços estão rodando..."
if ! docker ps | grep -q "vinheria-sales"; then
    echo -e "${RED}❌ Sales Service não está rodando. Execute: docker-compose up -d${NC}"
    exit 1
fi

if ! docker ps | grep -q "vinheria-inventory"; then
    echo -e "${RED}❌ Inventory Service não está rodando. Execute: docker-compose up -d${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Serviços estão rodando${NC}"
echo ""

# 1. Testar Health Checks
echo "🏥 === HEALTH CHECKS ==="
test_endpoint "GET" "https://localhost:3000/health" "Sales Service Health"
test_endpoint "GET" "https://localhost:3001/health" "Inventory Service Health"

# 2. Testar Informações dos Serviços
echo "ℹ️  === INFORMAÇÕES DOS SERVIÇOS ==="
test_endpoint "GET" "https://localhost:3000/" "Sales Service Info"
test_endpoint "GET" "https://localhost:3001/" "Inventory Service Info"

# 3. Obter Token JWT
echo "🔐 === AUTENTICAÇÃO JWT ==="
echo -e "${BLUE}🔍 Obtendo token JWT...${NC}"
token_response=$(curl -k -s https://localhost:3000/auth)
token=$(echo "$token_response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$token" ]; then
    echo -e "${GREEN}✅ Token obtido com sucesso${NC}"
    echo "🎫 Token: ${token:0:50}..."
    echo ""
else
    echo -e "${RED}❌ Falha ao obter token${NC}"
    echo "📄 Response: $token_response"
    exit 1
fi

# 4. Testar Endpoints Protegidos
echo "🔒 === ENDPOINTS PROTEGIDOS ==="
auth_header="Authorization: Bearer $token"

# Testar consulta de estoque
test_endpoint "GET" "https://localhost:3001/stock" "Consultar Estoque Total" "$auth_header"

# Testar consulta de produto específico
test_endpoint "GET" "https://localhost:3001/stock?product=Vinho%20Tinto%20Reserva" "Consultar Estoque Específico" "$auth_header"

# 5. Testar Comunicação Entre Serviços
echo "🔄 === COMUNICAÇÃO ENTRE SERVIÇOS ==="

# Criar pedido (Sales → Inventory)
order_data='{"product": "Vinho Tinto Reserva", "quantity": 2}'
test_endpoint "POST" "https://localhost:3000/order" "Criar Pedido (Sales → Inventory)" "$auth_header" "$order_data"

# Reservar estoque diretamente
reserve_data='{"product": "Champagne Premium", "quantity": 1}'
test_endpoint "POST" "https://localhost:3001/reserve" "Reservar Estoque Direto" "$auth_header" "$reserve_data"

# 6. Testar Reposição de Estoque
echo "📦 === REPOSIÇÃO DE ESTOQUE ==="
restock_data='{"product": "Vinho Branco Especial", "quantity": 10}'
test_endpoint "POST" "https://localhost:3001/restock" "Repor Estoque" "$auth_header" "$restock_data"

# 7. Testar Endpoints Sem Autenticação (devem falhar)
echo "🚫 === TESTES DE SEGURANÇA (devem falhar) ==="
test_endpoint "GET" "https://localhost:3001/stock" "Estoque Sem Token (deve falhar)"
test_endpoint "POST" "https://localhost:3000/order" "Pedido Sem Token (deve falhar)" "" "$order_data"

# 8. Testar DNS Interno
echo "🌐 === TESTE DE DNS INTERNO ==="
echo -e "${BLUE}🔍 Testando resolução DNS interna...${NC}"
if docker exec vinheria-sales nslookup sales.vinheria.local > /dev/null 2>&1; then
    echo -e "${GREEN}✅ sales.vinheria.local resolve corretamente${NC}"
else
    echo -e "${RED}❌ Falha na resolução de sales.vinheria.local${NC}"
fi

if docker exec vinheria-sales nslookup inventory.vinheria.local > /dev/null 2>&1; then
    echo -e "${GREEN}✅ inventory.vinheria.local resolve corretamente${NC}"
else
    echo -e "${RED}❌ Falha na resolução de inventory.vinheria.local${NC}"
fi

echo ""
echo "🎉 =========================================="
echo "🎉 Testes Concluídos!"
echo "🎉 =========================================="
echo ""
echo "📊 Para monitorar logs em tempo real:"
echo "   docker-compose logs -f"
echo ""
echo "🔍 Para capturar tráfego no Wireshark:"
echo "   Filtro: tcp.port == 3000 or tcp.port == 3001"
echo ""
echo "📖 Consulte o README.md para mais informações!"
