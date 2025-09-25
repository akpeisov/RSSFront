export interface IOConfig {
  outputs: Output[]; 
  inputs: Input[];
}

export interface Output {
    id: number;
    name: string;
    limit: number;
    type: string;
    default: string;
    state: string;
    alice: boolean;
    room: string;
    on: number;
    off: number;
    slaveId: number;
}

export interface Input {
    id: number;
    name: string;
}

