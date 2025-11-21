export interface SchedulerConfig {
  enabled: boolean;
  tasks: Array<{
    name: string;
    grace: number;
    time: number;
    enabled: boolean
    dow: number[];
    done: boolean;
    actions: Array<{
        action: string; 
        type: string;
        output?: number;
        input?: number;
    }>;
  }>;
}