const https = require("https");
const fs = require("fs");
const express = require("express");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const helmet = require("helmet");

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "vinheria-secret";

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Middleware de log
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
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

// Simulação de estoque em memória
let inventory = {
  "Vinho Tinto Reserva": 50,
  "Vinho Branco Especial": 30,
  "Champagne Premium": 15,
  "Rosé Clássico": 25,
  "Espumante Nacional": 40
};

// Endpoint para consultar estoque
app.get('/stock', validateJWT, (req, res) => {
  try {
    const { product } = req.query;

    if (product) {
      // Consultar estoque de um produto específico
      const stock = inventory[product] || 0;
      res.json({
        success: true,
        product: product,
        stock: stock,
        message: `Estoque consultado para ${product}`
      });
    } else {
      // Retornar todo o estoque
      const totalItems = Object.values(inventory).reduce((sum, qty) => sum + qty, 0);
      res.json({
        success: true,
        stock: totalItems,
        inventory: inventory,
        message: "Estoque total consultado"
      });
    }
  } catch (error) {
    console.error('Erro ao consultar estoque:', error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor"
    });
  }
});

// Endpoint para reservar estoque
app.post('/reserve', validateJWT, (req, res) => {
  try {
    const { product, quantity } = req.body;

    if (!product || !quantity) {
      return res.status(400).json({
        success: false,
        error: "Produto e quantidade são obrigatórios"
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        error: "Quantidade deve ser maior que zero"
      });
    }

    const currentStock = inventory[product] || 0;

    if (currentStock < quantity) {
      return res.status(400).json({
        success: false,
        error: "Estoque insuficiente",
        available: currentStock,
        requested: quantity
      });
    }

    // Reservar estoque (diminuir quantidade)
    inventory[product] = currentStock - quantity;
    
    const reservationId = `RES-${Date.now()}`;

    console.log(`Estoque reservado: ${quantity}x ${product}. Restante: ${inventory[product]}`);

    res.json({
      success: true,
      reservation_id: reservationId,
      product: product,
      quantity_reserved: quantity,
      remaining_stock: inventory[product],
      message: "Estoque reservado com sucesso"
    });

  } catch (error) {
    console.error('Erro ao reservar estoque:', error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor"
    });
  }
});

// Endpoint para repor estoque (para testes)
app.post('/restock', validateJWT, (req, res) => {
  try {
    const { product, quantity } = req.body;

    if (!product || !quantity) {
      return res.status(400).json({
        success: false,
        error: "Produto e quantidade são obrigatórios"
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        error: "Quantidade deve ser maior que zero"
      });
    }

    const currentStock = inventory[product] || 0;
    inventory[product] = currentStock + quantity;

    console.log(`Estoque reposto: ${quantity}x ${product}. Total: ${inventory[product]}`);

    res.json({
      success: true,
      product: product,
      quantity_added: quantity,
      new_stock: inventory[product],
      message: "Estoque reposto com sucesso"
    });

  } catch (error) {
    console.error('Erro ao repor estoque:', error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor"
    });
  }
});

// Endpoint de health check
app.get('/health', (req, res) => {
  res.json({
    service: "inventory-service",
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    total_products: Object.keys(inventory).length,
    total_stock: Object.values(inventory).reduce((sum, qty) => sum + qty, 0)
  });
});

// Endpoint raiz
app.get('/', (req, res) => {
  res.json({
    service: "Vinheria Agnello - Inventory Service",
    version: "1.0.0",
    endpoints: {
      stock: "GET /stock - Consultar estoque (requer JWT)",
      reserve: "POST /reserve - Reservar estoque (requer JWT)",
      restock: "POST /restock - Repor estoque (requer JWT)",
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
    console.log(`🍷 Vinheria Inventory Service rodando em HTTPS na porta ${PORT}`);
    console.log(`🔒 Certificados SSL carregados com sucesso`);
    console.log(`📦 Produtos em estoque: ${Object.keys(inventory).length}`);
    console.log(`📊 Total de itens: ${Object.values(inventory).reduce((sum, qty) => sum + qty, 0)}`);
  });
} catch (error) {
  console.error('Erro ao iniciar servidor HTTPS:', error);
  process.exit(1);
}
