export interface IOConfig {
  outputs: Output[]; 
  inputs: Input[];
}

export interface Output {
  uuid: string;
  id: number;
  name: string;
  type: 's' | 't';
  state: string;
  on?: number;
  off?: number;
  limit?: number;
  alice: boolean;
  room?: string;
  default: 'on' | 'off';
  slaveId?: number;
  mac?: string;
}

export interface Input {
    id: number;
    name: string;
}

