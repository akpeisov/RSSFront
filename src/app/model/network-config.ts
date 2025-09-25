export interface NetworkConfig {
  mac: string;
  ntpServer?: string;
  ntpTZ?: string;
  otaURL?: string;

  cloud?: {
    address?: string;
    enabled?: boolean;
  };

  eth?: {
    enabled?: boolean;
    dhcp?: boolean;
    ip?: string;
    netmask?: string;
    gateway?: string;
    dns?: string;
    enableReset?: boolean;
    resetGPIO?: number;
  };

  wifi?: {
    enabled?: boolean;
    dhcp?: boolean;
    ip?: string;
    netmask?: string;
    gateway?: string;
    ssid?: string;
    pass?: string;
    dns?: string;
  };

  ftp?: {
    enabled?: boolean;
    user?: string;
    pass?: string;
  };
}