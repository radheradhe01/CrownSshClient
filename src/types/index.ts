export interface VM {
  id: string;
  name: string;
  ip: string;
  username: string;
  password?: string;
  port: number;
  environmentId?: string;
  isPinned?: boolean;
}

export interface Environment {
  id: string;
  name: string;
  command?: string; // Custom command for this environment
  vmCount?: number;
}

export interface User {
  id: string;
  displayName: string;
  photos?: { value: string }[];
}

export interface ExecutionLog {
  vmId: string;
  type: 'stdout' | 'stderr' | 'info' | 'error';
  data: string;
  timestamp: number;
}

export interface ExecutionStatus {
  vmId: string;
  status: 'pending' | 'running' | 'success' | 'error';
}
