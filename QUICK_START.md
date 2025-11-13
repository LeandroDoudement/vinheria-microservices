# 🍷 Vinheria Agnello - Quick Start

## 🚀 Inicialização Rápida

```bash
# 1. Navegar para o diretório
cd vinheria-microservices

# 2. Dar permissão aos scripts
chmod +x *.sh

# 3. Iniciar todos os serviços
./start.sh

# 4. Testar endpoints (opcional)
./test-endpoints.sh
```

## 🧪 Teste Manual Rápido

### 1. Obter Token JWT
```bash
curl -k https://localhost:3000/auth
```

### 2. Consultar Estoque
```bash
TOKEN="seu_token_aqui"
curl -k -H "Authorization: Bearer $TOKEN" https://localhost:3001/stock
```

### 3. Criar Pedido
```bash
curl -k -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"product": "Vinho Tinto Reserva", "quantity": 2}' \
  https://localhost:3000/order
```

## 📊 Monitoramento

```bash
# Ver logs de todos os serviços
docker-compose logs -f

# Ver logs específicos
docker-compose logs -f sales-service
docker-compose logs -f inventory-service
docker-compose logs -f dns

# Status dos containers
docker-compose ps
```

## 🛑 Parar Serviços

```bash
docker-compose down
```

## 🔧 Troubleshooting

### Problema: Certificado SSL
```bash
# Regenerar certificados
rm -rf certs/*
./start.sh
```

### Problema: Porta ocupada
```bash
# Verificar portas
netstat -tlnp | grep -E "(3000|3001|53)"

# Parar containers
docker-compose down
```

### Problema: DNS não funciona
```bash
# Testar DNS
docker exec vinheria-dns nslookup sales.vinheria.local

# Reiniciar DNS
docker-compose restart dns
```

## 📖 Documentação Completa

Consulte o `README.md` para documentação detalhada e exemplos avançados.

---

**Desenvolvido para FIAP - Arquitetura de Microserviços**  
*Vinheria Agnello - Excelência em Vinhos desde 1985* 🍷
