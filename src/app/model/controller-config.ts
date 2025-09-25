import { IOConfig } from "./io-config";
import { ModbusConfig } from "./modbus-config";
import { NetworkConfig } from "./network-config";
import { SchedulerConfig } from "./scheduler-config";

export interface ControllerConfig {
    mac: string,
    modbus: ModbusConfig,
    network: NetworkConfig,
    scheduler: SchedulerConfig,
    io: IOConfig
}