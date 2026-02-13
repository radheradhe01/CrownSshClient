import { Worker } from 'bullmq';
import { connection } from '../config/redis.js';
import { sshService } from '../services/sshService.js';
import { vmService } from '../services/vmService.js';
import { broadcast } from '../services/socketService.js';
import logger from '../utils/logger.js';

export const executionWorker = new Worker(
  'execution-queue',
  async (job) => {
    const { vmId, command } = job.data;
    const vm = await vmService.getById(vmId);

    if (!vm) {
      logger.error(`VM not found: ${vmId}`);
      throw new Error(`VM not found: ${vmId}`);
    }

    broadcast('status', { vmId: vm.id, status: 'running' });

    try {
      await sshService.executeCommand(
        vm,
        command,
        (data) => broadcast('output', { vmId: vm.id, data }),
        (data) => broadcast('output', { vmId: vm.id, data })
      );
      broadcast('status', { vmId: vm.id, status: 'success' });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Execution failed for VM ${vmId}: ${errorMessage}`);
      broadcast('status', { vmId: vm.id, status: 'error' });
      throw error;
    }
  },
  { connection, concurrency: 5 }
);

executionWorker.on('completed', (job) => {
  logger.info(`Job ${job.id} completed`);
});

executionWorker.on('failed', (job, err) => {
  logger.error(`Job ${job?.id} failed: ${err.message}`);
});
