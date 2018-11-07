import joi from 'joi';
import { Errors, Validator } from 'moleculer';
const { ValidationError } = Errors;

export class JoiValidator extends Validator {
  constructor() {
    super();
    this.validator = joi;
  }

  compile(schema) {
    return params => this.validate(params, schema);
  }

  validate(params, schema) {
    const res = this.validator.validate(params, schema);
    if (res.error) throw new ValidationError(res.error.message, null, res.error.details);
    return true;
  }
}
