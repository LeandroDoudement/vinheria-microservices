# 🍷 Vinheria Agnello - Microservices

Projeto simulação de microserviços para simular o ambiente da **Vinheria Agnello** com comunicação HTTPS, DNS interno e autenticação JWT.

## 📋 Arquitetura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   DNS Service   │    │  Sales Service  │    │Inventory Service│
│  (dnsmasq)      │    │   (Node.js)     │    │   (Node.js)     │
│                 │    │                 │    │                 │
│ Port: 53/udp    │    │ Port: 3000      │    │ Port: 3001      │
│ IP: 172.20.0.2  │    │ IP: 172.20.0.10 │    │ IP: 172.20.0.11 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │ Docker Network  │
                    │ 172.20.0.0/16   │
                    └─────────────────┘
```

### Domínios Internos
- `sales.vinheria.local` → 172.20.0.10:3000
- `inventory.vinheria.local` → 172.20.0.11:3001

## 🚀 Como Rodar

### 1. Pré-requisitos
```bash
# Docker e Docker Compose instalados
docker --version
docker-compose --version
```

### 2. Iniciar os Serviços
```bash
# Clonar/navegar para o diretório
cd vinheria-microservices

# Subir todos os serviços
docker-compose up -d

# Verificar status
docker-compose ps
```

### 3. Verificar Logs
```bash
# Logs de todos os serviços
docker-compose logs -f

# Logs específicos
docker-compose logs -f sales-service
docker-compose logs -f inventory-service
docker-compose logs -f dns
```

## 🧪 Como Testar

### 1. Testar DNS Interno
```bash
# Testar resolução DNS
docker exec vinheria-dns nslookup sales.vinheria.local
docker exec vinheria-dns nslookup inventory.vinheria.local

# Verificar configuração DNS
docker exec vinheria-dns cat /etc/dnsmasq.conf
```

### 2. Testar Serviços (Health Check)
```bash
# Sales Service
curl -k https://localhost:3000/health

# Inventory Service  
curl -k https://localhost:3001/health
```

### 3. Testar Autenticação JWT

#### Obter Token JWT
```bash
# Gerar token no Sales Service
curl -k https://localhost:3000/auth

# Resposta esperada:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600,
  "message": "Token JWT gerado com sucesso para o serviço de vendas"
}
```

#### Usar Token para Acessar Recursos
```bash
# Salvar token em variável
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Consultar estoque (Inventory Service)
curl -k -H "Authorization: Bearer $TOKEN" \
  https://localhost:3001/stock

# Criar pedido (Sales Service → Inventory Service)
curl -k -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"product": "Vinho Tinto Reserva", "quantity": 2}' \
  https://localhost:3000/order
```

### 4. Testar Comunicação Entre Serviços

```bash
# O Sales Service chama o Inventory Service internamente
# Usar o endpoint /order para ver a comunicação completa

curl -k -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"product": "Champagne Premium", "quantity": 1}' \
  https://localhost:3000/order

# Fluxo:
# 1. Sales recebe pedido
# 2. Sales consulta estoque no Inventory (via DNS interno)
# 3. Sales reserva estoque no Inventory
# 4. Sales retorna confirmação do pedido
```

## 🔍 Capturar Tráfego com Wireshark

### HTTP vs HTTPS Comparison

#### 1. Instalar Wireshark
```bash
# Ubuntu/Debian
sudo apt install wireshark

# Ou usar interface gráfica
sudo wireshark
```

#### 2. Capturar Tráfego HTTPS
```bash
# Filtro no Wireshark: tcp.port == 3000 or tcp.port == 3001
# Fazer requisições e observar:
# - Handshake TLS/SSL
# - Dados criptografados
# - Certificados trocados
```

#### 3. Simular HTTP (para comparação)
```bash
# Modificar temporariamente os serviços para HTTP
# Comentar as linhas HTTPS no index.js e usar:
# app.listen(PORT, '0.0.0.0', () => { ... });

# Observar diferença:
# - HTTP: dados em texto claro
# - HTTPS: dados criptografados
```

### Pontos de Observação no Wireshark
1. **DNS Queries**: Resolução de `sales.vinheria.local`
2. **TLS Handshake**: Troca de certificados
3. **HTTP Headers**: Authorization Bearer tokens
4. **Encrypted Payload**: Dados JSON criptografados

## 🔐 Segurança

### Certificados SSL
- **Localização**: `./certs/`
- **Tipo**: Self-signed
- **Validade**: 365 dias
- **CN**: `*.vinheria.local`

### JWT Configuration
- **Secret**: `vinheria-secret`
- **Algoritmo**: HS256
- **Expiração**: 1 hora
- **Payload**:
  ```json
  {
    "service": "sales",
    "iat": 1234567890,
    "exp": 1234571490
  }
  ```

## 📊 Endpoints Disponíveis

### Sales Service (https://localhost:3000)
| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/` | Informações do serviço | ❌ |
| GET | `/health` | Status do serviço | ❌ |
| GET | `/auth` | Gerar token JWT | ❌ |
| POST | `/order` | Criar pedido | ✅ |

### Inventory Service (https://localhost:3001)
| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/` | Informações do serviço | ❌ |
| GET | `/health` | Status do serviço | ❌ |
| GET | `/stock` | Consultar estoque | ✅ |
| POST | `/reserve` | Reservar estoque | ✅ |
| POST | `/restock` | Repor estoque | ✅ |

## 🛠️ Desenvolvimento

### Estrutura do Projeto
```
vinheria-microservices/
├── docker-compose.yml          # Orquestração dos containers
├── Jenkinsfile                 # Pipeline CI/CD
├── README.md                   # Este arquivo
├── certs/                      # Certificados SSL
│   ├── cert.pem
│   └── key.pem
├── dns/                        # Serviço DNS
│   ├── Dockerfile
│   └── dnsmasq.conf
├── sales-service/              # Serviço de Vendas
│   ├── Dockerfile
│   ├── package.json
│   └── index.js
└── inventory-service/          # Serviço de Estoque
    ├── Dockerfile
    ├── package.json
    └── index.js
```

### Modificar Configurações

#### Alterar Domínios DNS
```bash
# Editar dns/dnsmasq.conf
address=/sales.vinheria.local/172.20.0.10
address=/inventory.vinheria.local/172.20.0.11

# Reiniciar DNS
docker-compose restart dns
```

#### Alterar JWT Secret
```bash
# Editar docker-compose.yml
environment:
  - JWT_SECRET=novo-secret-aqui

# Reiniciar serviços
docker-compose restart sales-service inventory-service
```

## 🚨 Troubleshooting

### Problemas Comuns

#### 1. Erro de DNS
```bash
# Sintoma: "getaddrinfo ENOTFOUND sales.vinheria.local"
# Solução: Verificar se DNS está rodando
docker-compose logs dns

# Testar resolução manual
docker exec vinheria-sales nslookup sales.vinheria.local
```

#### 2. Erro de Certificado SSL
```bash
# Sintoma: "UNABLE_TO_VERIFY_LEAF_SIGNATURE"
# Solução: Certificados são self-signed, usar -k no curl
curl -k https://localhost:3000/health

# Ou regenerar certificados
cd certs/
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
```

#### 3. Erro de JWT
```bash
# Sintoma: "Token JWT inválido ou expirado"
# Solução: Gerar novo token
curl -k https://localhost:3000/auth

# Verificar se secret está correto nos dois serviços
docker-compose logs sales-service | grep JWT_SECRET
docker-compose logs inventory-service | grep JWT_SECRET
```

#### 4. Serviços não Comunicam
```bash
# Verificar rede Docker
docker network ls
docker network inspect vinheria-microservices_vinheria-network

# Testar conectividade
docker exec vinheria-sales ping inventory.vinheria.local
```

## 🔄 CI/CD com Jenkins

### Pipeline Stages
1. **Checkout**: Baixar código
2. **Build**: Construir imagens Docker
3. **Test**: Validar sintaxe e configurações
4. **Security Scan**: Verificar vulnerabilidades
5. **Deploy**: Implantar em `/var/vinheria-deploy`
6. **Health Check**: Verificar serviços

### Executar Pipeline
```bash
# No Jenkins, criar novo job tipo Pipeline
# Apontar para o Jenkinsfile do projeto
# Executar build
```

## 📈 Monitoramento

### Logs Centralizados
```bash
# Ver todos os logs em tempo real
docker-compose logs -f --tail=100

# Filtrar por serviço
docker-compose logs -f sales-service | grep ERROR
```

### Métricas Básicas
```bash
# Status dos containers
docker-compose ps

# Uso de recursos
docker stats

# Verificar portas
netstat -tlnp | grep -E "(3000|3001|53)"
```

## 🎯 Próximos Passos

1. **Adicionar Banco de Dados**: PostgreSQL ou MongoDB
2. **Implementar Circuit Breaker**: Para resiliência
3. **Adicionar Rate Limiting**: Controle de requisições
4. **Implementar Tracing**: Jaeger ou Zipkin
5. **Adicionar Métricas**: Prometheus + Grafana
6. **Implementar Service Mesh**: Istio ou Linkerd

---

**Desenvolvido para FIAP - Arquitetura de Microserviços**  
*Vinheria Agnello - Excelência em Vinhos desde 1985* 🍷
