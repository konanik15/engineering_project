import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'pluralize'
})
export class PluralizePipe implements PipeTransform {
  transform(count: number, singularWord: string): string {
    return count === 1 ? `${count} ${singularWord}` : `${count} ${singularWord}s`;
  }
}
