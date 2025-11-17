import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import { DataService } from '../../services/data.service';
import { RouterModule } from '@angular/router';
import { ControllerConfig } from '../../model/controller-config';
import { WebsocketService } from '../../services/websocket.service';
import { AnimationService } from '../../services/animation.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit {
  availableMaster: any[] = [];
  formError: string = '';
  mac: string = '';
  config: ControllerConfig | null = null;

  constructor(private dataService: DataService, 
              private route: ActivatedRoute,
              private router: Router,
              private location: Location,
              private animationService: AnimationService,
              private websocketService: WebsocketService) {}

  ngOnInit() {
    this.mac = this.route.snapshot.paramMap.get('mac') || '';
    //this.availableMaster = (this.dataService.controllers || []).filter((ctrl: any) => ctrl.modbus?.mode !== 'slave');
    this.dataService.getControllerByMacWithFetch(this.mac).subscribe((config) => {
      console.log('Fetched', config)
      // Корректная инициализация config и всех вложенных объектов
      const emptyConfig: ControllerConfig = {
        mac: this.mac,
        name: '',
        description: '',
        modbus: {
          mode: 'none',          
          pollingTime: 100,
          readTimeout: 200,
          maxRetries: 3,
          actionOnSameSlave: false
        },
        network: {
          mac: this.mac,
          ntpServer: 'pool.ntp.org',
          ntpTZ: 'UTC-5:00',
          otaURL: 'https://api.akpeisov.kz/RelayController.bin',
          cloud: { address: 'wss://api.akpeisov.kz/ws', enabled: false },
          eth: { enabled: false, dhcp: true, ip: '', netmask: '', gateway: '', dns: '', enableReset: false, resetGPIO: 0 },
          wifi: { enabled: false, dhcp: true, ip: '', netmask: '', gateway: '', ssid: '', pass: '', dns: '' },
          ftp: { enabled: false, user: 'admin', pass: 'admin' }
        },
        scheduler: { enabled: false, tasks: [] },
        io: { outputs: [], inputs: [] }
      };
      // Если config не пришёл, используем пустой
      if (!config) {
        this.config = emptyConfig;
      } else {
        // Если config пришёл, дополняем недостающие объекты
        this.config = {
          mac: config.mac ?? this.mac,
          name: config.name,
          description: config.description,
          modbus: { ...emptyConfig.modbus, ...(config.modbus ?? {}) },
          network: {
            ...emptyConfig.network,
            ...(config.network ?? {}),
            cloud: { ...emptyConfig.network.cloud, ...(config.network?.cloud ?? {}) },
            eth: { ...emptyConfig.network.eth, ...(config.network?.eth ?? {}) },
            wifi: { ...emptyConfig.network.wifi, ...(config.network?.wifi ?? {}) },
            ftp: { ...emptyConfig.network.ftp, ...(config.network?.ftp ?? {}) }
          },
          scheduler: { ...emptyConfig.scheduler, ...(config.scheduler ?? {}) },
          io: { ...emptyConfig.io, ...(config.io ?? {}) }
        };
      }
      this.initModbusConfig();
    });
  }
    
  toggleDow(task: any, day: number) {
    if (!Array.isArray(task.dow)) task.dow = [];
    const idx = task.dow.indexOf(day);
    if (idx > -1) {
      task.dow.splice(idx, 1);
    } else {
      task.dow.push(day);
      task.dow.sort();
    }
  }

  updateTaskTime(task: any, value: string) {
    if (!value) return;
    const match = value.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
    if (!match) return;
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    task.time = hours * 60 + minutes;
  }

  initModbusConfig() {
    if (this.config == null) {
      console.log('Config is null');
      return;
    }
    // Получаем список контроллеров, кроме текущего
    this.availableMaster = (this.dataService.controllers || []).filter((ctrl: any) => ctrl.mac !== this.config?.mac && ctrl.modbus?.mode != 'slave');
    // Копируем текущую конфигурацию modbus или создаем дефолтную    
    if (this.config.modbus == null || this.config.modbus.mode == null) {
      this.config.modbus.mode = 'none';
    }    
    if (this.config.modbus.mode === 'master') {
      if (this.config.modbus.actionOnSameSlave == null) {
        this.config.modbus.actionOnSameSlave = false;      
      }
      if (this.config.modbus.pollingTime == null) {
        this.config.modbus.pollingTime = 100;
      }
      if (this.config.modbus.readTimeout == null) {
        this.config.modbus.readTimeout = 200;
      }
      if (this.config.modbus.maxRetries == null) {
        this.config.modbus.maxRetries = 3;      
      }
    }
  }

  validateConfig():boolean {
    this.formError = '';
    if (this.config?.modbus.mode === 'master') {
      if (this.config?.modbus.maxRetries == null || this.config?.modbus.maxRetries > 5 || this.config?.modbus.maxRetries < 0) {
        this.formError = 'maxRetries must be in 0..5';
        return false;
      }
      if (this.config?.modbus.pollingTime == null || this.config?.modbus.pollingTime > 5000 || this.config?.modbus.pollingTime < 100) {
        this.formError = 'pollingTime must be in 100..5000';
        return false;
      }
      if (this.config?.modbus.readTimeout == null || this.config?.modbus.readTimeout > 1000 || this.config?.modbus.readTimeout < 50) {
        this.formError = 'readTimeout must be in 50..1000';
        return false;
      }
    } else if (this.config?.modbus.mode === 'slave') {
      if (this.config?.modbus.slaveId == null || this.config?.modbus.slaveId < 1 || this.config?.modbus.slaveId > 250) {
        this.formError = 'slaveId must be in 1..250';
        return false;
      }
      if (this.config?.modbus.master == null) {
        this.formError = 'master controller must be chosen';
        return false;
      }
    }      
    // net
    if (!this.config?.network.ntpServer) {
        this.formError = 'NTP Server не может быть пустым';
        return false;
      }
    if (!this.config?.network.ntpTZ) {
      this.formError = 'NTP Server timezone не может быть пустым';
      return false;
    }
    if (this.config?.network.cloud?.enabled && !this.config?.network.cloud.address) {
      this.formError = 'Cloud address не может быть пустым';
      return false;
    }
    if (this.config?.network.eth?.enabled) {
      if (this.config?.network.eth.enableReset && this.config?.network.eth.resetGPIO == null) {
        this.formError = 'Ethernet resetGPIO не может быть пустым';
        return false;
      }
      if (!this.config?.network.eth.dhcp && !this.config?.network.eth.ip) {
        this.formError = 'Ethernet IP не может быть пустым';
        return false;
      }
      if (!this.config?.network.eth.dhcp && !this.config?.network.eth.netmask) {
        this.formError = 'Ethernet Netmask не может быть пустым';
        return false;
      }
      if (!this.config?.network.eth.dhcp && !this.config?.network.eth.gateway) {
        this.formError = 'Ethernet Gateway не может быть пустым';
        return false;
      }
      if (!this.config?.network.eth.dhcp && !this.config?.network.eth.dns) {
        this.formError = 'Ethernet DNS не может быть пустым';
        return false;
      }
    }
    if (this.config?.network.wifi?.enabled) {
      if (!this.config?.network.wifi.ssid) {
        this.formError = 'WiFi SSID не может быть пустым';
        return false;
      }
      if (!this.config?.network.wifi.pass) {
        this.formError = 'WiFi Password не может быть пустым';
        return false;
      }
      if (!this.config?.network.wifi.dhcp && !this.config?.network.wifi.ip) {
        this.formError = 'Wifi IP не может быть пустым';
        return false;
      }
      if (!this.config?.network.wifi.dhcp && !this.config?.network.wifi.netmask) {
        this.formError = 'Wifi Netmask не может быть пустым';
        return false;
      }
      if (!this.config?.network.wifi.dhcp && !this.config?.network.wifi.gateway) {
        this.formError = 'Wifi Gateway не может быть пустым';
        return false;
      }
      if (!this.config?.network.wifi.dhcp && !this.config?.network.wifi.dns) {
        this.formError = 'Wifi DNS не может быть пустым';
        return false;
      }
    }
    if (this.config?.network.ftp?.enabled) {
      if (!this.config?.network.ftp.user) {
        this.formError = 'FTP User не может быть пустым';
        return false;
      }
      if (!this.config?.network.ftp.pass) {
        this.formError = 'FTP Password не может быть пустым';
        return false;
      }
    }
    return true;
  }

  saveConfig() {
    console.log(this.config)    
    if (!this.validateConfig()) {
      return;
    }
    this.websocketService.sendMessage({
      type: 'DEVICECONFIG',
      payload: this.config      
    });    
  }

  public back(): void {
    this.animationService.triggerLeaveAnimation();
    setTimeout(() => {
      if (this.mac) {
        this.router.navigate(['/controller', this.mac]);
      } else {
        this.location.back();
      }
    }, 150); // Half the animation duration for smoother transition
    // <!-- <button class="back-btn" [routerLink]="['/controller', mac]">Back</button> -->
  }

}
