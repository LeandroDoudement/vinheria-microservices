const https = require("https");
const fs = require("fs");
const express = require("express");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const cors = require("cors");
const helmet = require("helmet");

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "vinheria-secret";
const INVENTORY_URL = process.env.INVENTORY_URL || "https://inventory.vinheria.local:3001";

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Configurar axios para aceitar certificados self-signed
const httpsAgent = new (require('https').Agent)({
  rejectUnauthorized: false
});

// Middleware de log
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Endpoint para gerar JWT
app.get('/auth', (req, res) => {
  try {
    const payload = {
      service: "sales",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hora
    };

    const token = jwt.sign(payload, JWT_SECRET);
    
    res.json({
      success: true,
      token: token,
      expires_in: 3600,
      message: "Token JWT gerado com sucesso para o serviço de vendas"
    });
  } catch (error) {
    console.error('Erro ao gerar token:', error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor"
    });
  }
});

// Middleware para validar JWT
const validateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: "Token JWT não fornecido ou formato inválido"
    });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: "Token JWT inválido ou expirado"
    });
  }
};

// Endpoint para criar pedido (chama inventory-service)
app.post('/order', validateJWT, async (req, res) => {
  try {
    const { product, quantity } = req.body;

    if (!product || !quantity) {
      return res.status(400).json({
        success: false,
        error: "Produto e quantidade são obrigatórios"
      });
    }

    console.log(`Processando pedido: ${quantity}x ${product}`);

    // 1. Verificar estoque no inventory-service
    try {
      const stockResponse = await axios.get(`${INVENTORY_URL}/stock`, {
        httpsAgent,
        headers: {
          'Authorization': req.headers.authorization
        }
      });

      console.log('Resposta do estoque:', stockResponse.data);

      if (stockResponse.data.stock < quantity) {
        return res.status(400).json({
          success: false,
          error: "Estoque insuficiente",
          available_stock: stockResponse.data.stock,
          requested: quantity
        });
      }
    } catch (error) {
      console.error('Erro ao consultar estoque:', error.message);
      return res.status(503).json({
        success: false,
        error: "Serviço de estoque indisponível"
      });
    }

    // 2. Reservar estoque no inventory-service
    try {
      const reserveResponse = await axios.post(`${INVENTORY_URL}/reserve`, {
        product,
        quantity
      }, {
        httpsAgent,
        headers: {
          'Authorization': req.headers.authorization,
          'Content-Type': 'application/json'
        }
      });

      console.log('Resposta da reserva:', reserveResponse.data);

      // 3. Criar pedido (simulado)
      const orderId = `ORD-${Date.now()}`;
      
      res.json({
        success: true,
        order_id: orderId,
        product: product,
        quantity: quantity,
        status: "confirmed",
        message: "Pedido criado com sucesso",
        inventory_response: reserveResponse.data
      });

    } catch (error) {
      console.error('Erro ao reservar estoque:', error.message);
      return res.status(503).json({
        success: false,
        error: "Erro ao reservar estoque"
      });
    }

  } catch (error) {
    console.error('Erro no processamento do pedido:', error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor"
    });
  }
});

// Endpoint de health check
app.get('/health', (req, res) => {
  res.json({
    service: "sales-service",
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
});

// Endpoint raiz
app.get('/', (req, res) => {
  res.json({
    service: "Vinheria Agnello - Sales Service",
    version: "1.0.0",
    endpoints: {
      auth: "GET /auth - Gerar token JWT",
      order: "POST /order - Criar pedido (requer JWT)",
      health: "GET /health - Status do serviço"
    }
  });
});

// Iniciar servidor HTTPS
try {
  const options = {
    key: fs.readFileSync('/app/certs/key.pem'),
    cert: fs.readFileSync('/app/certs/cert.pem')
  };

  https.createServer(options, app).listen(PORT, '0.0.0.0', () => {
    console.log(`🍷 Vinheria Sales Service rodando em HTTPS na porta ${PORT}`);
    console.log(`🔒 Certificados SSL carregados com sucesso`);
    console.log(`🌐 Inventory URL: ${INVENTORY_URL}`);
  });
} catch (error) {
  console.error('Erro ao iniciar servidor HTTPS:', error);
  process.exit(1);
}
