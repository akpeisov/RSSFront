export interface ModbusConfig {
  mode: 'none' | 'master' | 'slave';
  pollingTime?: number;
  readTimeout?: number;
  maxRetries?: number;
  actionOnSameSlave?: boolean;
  slaveId?: number;
  master?: string;
  mac?: string;
}