import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { KillSwitch, AgentConfig, TransactionRequest } from '@killswitch/core';

const app = express();
const killSwitch = new KillSwitch();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.post('/api/v1/agents', (req: Request, res: Response) => {
  const agent: AgentConfig = req.body;
  killSwitch.registerAgent(agent);
  res.json({ success: true, agentId: agent.id });
});

app.post('/api/v1/validate', async (req: Request, res: Response) => {
  const tx: TransactionRequest = req.body;
  const result = await killSwitch.validate(tx);
  res.json(result);
});

app.post('/api/v1/killswitch/trigger', (req: Request, res: Response) => {
  const { agentId, reason } = req.body;
  killSwitch.triggerKillSwitch(agentId || null, 'manual', reason || 'Manual trigger');
  res.json({ success: true, triggered: true });
});

app.post('/api/v1/killswitch/reset', (req: Request, res: Response) => {
  const { agentId } = req.body;
  killSwitch.resetKillSwitch(agentId);
  res.json({ success: true, reset: true });
});

app.get('/api/v1/killswitch/status', (req: Request, res: Response) => {
  res.json({ globalKillActive: killSwitch.isGlobalKillActive() });
});

app.get('/api/v1/agents/:agentId/status', (req: Request, res: Response) => {
  const status = killSwitch.getAgentStatus(req.params.agentId);
  res.json({ agentId: req.params.agentId, status });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log('API running on port ' + PORT));

export default app;
