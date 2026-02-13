import { Client } from 'ssh2';
import { VM } from './vmService';

export const sshService = {
  executeCommand(vm: VM, command: string, onOutput: (data: string) => void, onError: (data: string) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      const conn = new Client();
      
      // Replace {{PASSWORD}} placeholder with actual VM password safely
      // We escape single quotes because the default command uses '{{PASSWORD}}'
      // If the user's command doesn't use quotes around {{PASSWORD}}, this might be weird, 
      // but for the specific use case of echo '{{PASSWORD}}', we need to escape single quotes in the password.
      const safePassword = (vm.password || '').replace(/'/g, "'\\''");
      const finalCommand = command.replace(/{{PASSWORD}}/g, safePassword);
  
      conn.on('ready', () => {
        onOutput(`[${vm.name || vm.ip}] Connected.\n`);
        conn.exec(finalCommand, (err, stream) => {
          if (err) {
            onError(`[${vm.name || vm.ip}] Error: ${err.message}\n`);
            conn.end();
            reject(err);
            return;
          }

          stream.on('close', (code: number) => {
            onOutput(`[${vm.name || vm.ip}] Connection closed (Code: ${code}).\n`);
            conn.end();
            resolve();
          }).on('data', (data: Buffer) => {
            onOutput(`[${vm.name || vm.ip}] STDOUT: ${data.toString()}`);
          }).stderr.on('data', (data: Buffer) => {
            onError(`[${vm.name || vm.ip}] STDERR: ${data.toString()}`);
          });
        });
      }).on('error', (err) => {
        onError(`[${vm.name || vm.ip}] Connection Error: ${err.message}\n`);
        reject(err);
      }).connect({
        host: vm.ip,
        port: vm.port,
        username: vm.username,
        password: vm.password,
        readyTimeout: 20000,
      });
    });
  }
};
