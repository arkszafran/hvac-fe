import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function passwordComplexityValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = typeof control.value === 'string' ? control.value : '';

    if (!value) {
      return null;
    }

    return /[A-Z]/.test(value) && /\d/.test(value) ? null : { passwordComplexity: true };
  };
}
