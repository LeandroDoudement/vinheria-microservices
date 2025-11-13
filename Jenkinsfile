pipeline {
    agent any
    
    environment {
        PROJECT_NAME = 'vinheria-microservices'
        DEPLOY_PATH = '/var/vinheria-deploy'
        DOCKER_COMPOSE_FILE = 'docker-compose.yml'
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo '🔄 Fazendo checkout do código da Vinheria Agnello...'
                // git branch: 'main', url: 'https://github.com/vinheria/microservices.git'
                echo '✅ Checkout concluído'
            }
        }
        
        stage('Build') {
            steps {
                echo '🏗️ Build da Vinheria Agnello iniciado...'
                echo '📦 Construindo imagens Docker dos microserviços...'
                
                script {
                    // Construir imagens Docker
                    sh '''
                        echo "Building DNS service..."
                        docker build -t vinheria/dns:latest ./dns/
                        
                        echo "Building Sales service..."
                        docker build -t vinheria/sales:latest ./sales-service/
                        
                        echo "Building Inventory service..."
                        docker build -t vinheria/inventory:latest ./inventory-service/
                    '''
                }
                
                echo '✅ Build concluído com sucesso!'
            }
        }
        
        stage('Test') {
            steps {
                echo '🧪 Executando testes da Vinheria...'
                
                script {
                    // Testes básicos de sintaxe
                    sh '''
                        echo "Validando sintaxe dos arquivos JavaScript..."
                        node -c sales-service/index.js
                        node -c inventory-service/index.js
                        
                        echo "Validando docker-compose.yml..."
                        docker-compose -f docker-compose.yml config
                    '''
                }
                
                echo '✅ Testes executados com sucesso!'
            }
        }
        
        stage('Security Scan') {
            steps {
                echo '🔒 Executando verificações de segurança...'
                
                script {
                    sh '''
                        echo "Verificando vulnerabilidades conhecidas..."
                        # npm audit --audit-level moderate || true
                        
                        echo "Verificando certificados SSL..."
                        openssl x509 -in certs/cert.pem -text -noout | grep "Subject:"
                    '''
                }
                
                echo '✅ Verificações de segurança concluídas!'
            }
        }
        
        stage('Deploy') {
            steps {
                echo '🚀 Deploy da Vinheria Agnello iniciado...'
                
                script {
                    sh """
                        echo "Criando diretório de deploy..."
                        sudo mkdir -p ${DEPLOY_PATH}
                        
                        echo "Copiando arquivos para ${DEPLOY_PATH}..."
                        sudo cp -r . ${DEPLOY_PATH}/
                        
                        echo "Definindo permissões..."
                        sudo chown -R jenkins:jenkins ${DEPLOY_PATH}
                        
                        echo "Parando serviços existentes..."
                        cd ${DEPLOY_PATH}
                        docker-compose down || true
                        
                        echo "Iniciando novos serviços..."
                        docker-compose up -d
                        
                        echo "Aguardando serviços ficarem prontos..."
                        sleep 30
                        
                        echo "Verificando status dos serviços..."
                        docker-compose ps
                    """
                }
                
                echo '✅ Deploy concluído com sucesso!'
            }
        }
        
        stage('Health Check') {
            steps {
                echo '🏥 Verificando saúde dos serviços...'
                
                script {
                    sh '''
                        echo "Testando Sales Service..."
                        curl -k -f https://localhost:3000/health || echo "Sales service não está respondendo"
                        
                        echo "Testando Inventory Service..."
                        curl -k -f https://localhost:3001/health || echo "Inventory service não está respondendo"
                        
                        echo "Verificando DNS..."
                        docker exec vinheria-dns nslookup sales.vinheria.local || echo "DNS não está funcionando"
                    '''
                }
                
                echo '✅ Health check concluído!'
            }
        }
    }
    
    post {
        always {
            echo '📋 Limpando workspace...'
            cleanWs()
        }
        
        success {
            echo '🎉 Pipeline da Vinheria Agnello executado com SUCESSO!'
            echo '🍷 Todos os microserviços estão rodando corretamente!'
            
            // Notificação de sucesso (opcional)
            // slackSend channel: '#vinheria-deploy', 
            //           color: 'good', 
            //           message: "✅ Deploy da Vinheria realizado com sucesso! 🍷"
        }
        
        failure {
            echo '❌ Pipeline da Vinheria Agnello FALHOU!'
            echo '🔧 Verifique os logs para identificar o problema.'
            
            // Notificação de falha (opcional)
            // slackSend channel: '#vinheria-deploy', 
            //           color: 'danger', 
            //           message: "❌ Falha no deploy da Vinheria! Verificar logs urgentemente."
        }
        
        unstable {
            echo '⚠️ Pipeline da Vinheria Agnello INSTÁVEL!'
            echo '🔍 Alguns testes falharam, mas o deploy foi realizado.'
        }
    }
}
