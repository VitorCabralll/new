import express from 'express';
import cors from 'cors';
import agentRoutes from './routes/agents.js';
import generateRoutes from './routes/generate.js';
import generateV2Routes from './routes/generateV2.js'; // ← NOVO: Sistema de agentes treináveis
import generateInstructionRoutes from './routes/generateInstruction.js';
import auditRoutes from './routes/audit.js';
import sessionRoutes from './routes/sessions.js';
import agentTrainingRoutes from './routes/agentTraining.js';

const app = express();

// Middleware
app.use(cors()); // Permite requisições de origens diferentes (essencial para o frontend)
app.use(express.json()); // Habilita o parsing de JSON no corpo das requisições

// Rotas da API
app.use('/api', agentRoutes);
app.use('/api', generateRoutes); // Sistema antigo (compatibilidade)
app.use('/api', generateV2Routes); // ← NOVO: Sistema de agentes treináveis
app.use('/api', generateInstructionRoutes);
app.use('/api', auditRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api', agentTrainingRoutes); // Rotas de treinamento de agentes

// Endpoint de health check
app.get('/', (req, res) => {
  res.send('Assistente Jurídico IA Backend is running!');
});

// Global error handler - DEVE SER O ÚLTIMO MIDDLEWARE
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('=== ERRO GLOBAL CAPTURADO ===');
  console.error('Timestamp:', new Date().toISOString());
  console.error('Path:', req.path);
  console.error('Method:', req.method);
  console.error('Error:', err);
  console.error('Stack:', err.stack);
  console.error('============================');

  // Se resposta já foi enviada, delega para error handler padrão do Express
  if (res.headersSent) {
    return next(err);
  }

  // Determinar código de status
  const statusCode = err.statusCode || err.status || 500;

  // Resposta de erro estruturada
  res.status(statusCode).json({
    message: err.message || 'Erro interno do servidor',
    code: err.code || 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && {
      error: err.message,
      stack: err.stack,
      details: err
    })
  });
});

// O ambiente de execução irá escutar em uma porta.
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Exporta o app para que o ambiente de execução possa usá-lo
export default app;
