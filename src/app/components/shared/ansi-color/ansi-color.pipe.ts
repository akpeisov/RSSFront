import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({ name: 'ansiColor', standalone: true })
export class AnsiColorPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string): string {
    if (!value) return '';
    // Заменяем ANSI escape-коды на HTML-стили
    //return value
    value = value
      // Стандартные ANSI-escape
      .replace(/\x1b\[0;32m/g, '<span style="color: #388e3c !important;">')
      .replace(/\x1b\[0;31m/g, '<span style="color: #d32f2f !important;">')
      .replace(/\x1b\[0;33m/g, '<span style="color: #fbc02d !important;">')
      .replace(/\x1b\[0;36m/g, '<span style="color: #0288d1 !important;">')
      // Ваша маркировка
      .replace(/\[0;32m/g, '<span style="color: #388e3c !important;">')
      .replace(/\[0;31m/g, '<span style="color: #d32f2f !important;">')
      .replace(/\[0;33m/g, '<span style="color: #fbc02d !important;">')
      .replace(/\[0;36m/g, '<span style="color: #0288d1 !important;">')
      // Сброс цвета
      .replace(/\x1b\[0m/g, '</span>')
      .replace(/\[0m/g, '</span>');
//console.log(value)
      //return value;
      return this.sanitizer.bypassSecurityTrustHtml(value) as string;
  }
}
