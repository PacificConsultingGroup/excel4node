import * as myUtils from '../../utils';

const cleanFormula = (f) => {
  if (typeof f === 'number' || f.substr(0, 1) === '=') {
    return f;
  }
  return '"' + f + '"';
};

interface DataValidationConstructorOpts {
  sqref?: string;
  formulas?: any[];
  allowBlank?: boolean;
  error?: string;
  errorStyle?: 'stop' | 'warning' | 'information';
  errorTitle?: string;
  imeMode?:
    | 'noControl'
    | 'off'
    | 'on'
    | 'disabled'
    | 'hiragana'
    | 'fullKatakana'
    | 'halfKatakana'
    | 'fullAlpha'
    | 'halfAlpha'
    | 'fullHangul'
    | 'halfHangul';
  operator?:
    | 'between'
    | 'notBetween'
    | 'equal'
    | 'notEqual'
    | 'lessThan'
    | 'lessThanOrEqual'
    | 'greaterThan'
    | 'greaterThanOrEqual';
  prompt?: string;
  promptTitle?: string;
  showDropDown?: boolean;
  showErrorMessage?: boolean;
  showInputMessage?: boolean;
  type?:
    | 'none'
    | 'whole'
    | 'decimal'
    | 'list'
    | 'date'
    | 'time'
    | 'textLength'
    | 'custom';
}

export class DataValidation {
  public sqref;
  public formula1;
  public formula2;
  public allowBlank;
  public errorStyle;
  public error;
  public showErrorMessage;
  public errorTitle;
  public imeMode;
  public operator;
  public prompt;
  public showInputMessage;
  public promptTitle;
  public showDropDown;
  public type;

  // §18.3.1.32 dataValidation (Data Validation)
  constructor(opts: DataValidationConstructorOpts = {}) {
    if (opts.sqref === undefined) {
      throw new TypeError(
        'sqref must be specified when creating a DataValidation instance.',
      );
    }
    this.sqref = opts.sqref;
    if (opts.formulas instanceof Array) {
      opts.formulas[0] !== undefined
        ? (this.formula1 = opts.formulas[0])
        : null;
      opts.formulas[1] !== undefined
        ? (this.formula2 = opts.formulas[1])
        : null;
    }

    if (opts.allowBlank !== undefined) {
      if (Number(opts.allowBlank) === 1) {
        opts.allowBlank = true;
      }
      if (Number(opts.allowBlank) === 0) {
        opts.allowBlank = false;
      }
      if (typeof opts.allowBlank !== 'boolean') {
        throw new TypeError(
          'DataValidation allowBlank must be true, false, 1 or 0',
        );
      }
      this.allowBlank = opts.allowBlank;
    }

    if (opts.errorStyle !== undefined) {
      const enums = ['stop', 'warning', 'information'];
      if (enums.indexOf(opts.errorStyle) < 0) {
        throw new TypeError(
          'DataValidation errorStyle must be one of ' + enums.join(', '),
        );
      }
      this.errorStyle = opts.errorStyle;
    }

    if (opts.error !== undefined) {
      if (typeof opts.error !== 'string') {
        throw new TypeError('DataValidation error must be a string');
      }
      this.error = opts.error;
      this.showErrorMessage = opts.showErrorMessage = true;
    }

    if (opts.errorTitle !== undefined) {
      if (typeof opts.errorTitle !== 'string') {
        throw new TypeError('DataValidation errorTitle must be a string');
      }
      this.errorTitle = opts.errorTitle;
      this.showErrorMessage = opts.showErrorMessage = true;
    }

    if (opts.imeMode !== undefined) {
      const enums = [
        'noControl',
        'off',
        'on',
        'disabled',
        'hiragana',
        'fullKatakana',
        'halfKatakana',
        'fullAlpha',
        'halfAlpha',
        'fullHangul',
        'halfHangul',
      ];
      if (enums.indexOf(opts.imeMode) < 0) {
        throw new TypeError(
          'DataValidation imeMode must be one of ' + enums.join(', '),
        );
      }
      this.imeMode = opts.imeMode;
    }

    if (opts.operator !== undefined) {
      const enums = [
        'between',
        'notBetween',
        'equal',
        'notEqual',
        'lessThan',
        'lessThanOrEqual',
        'greaterThan',
        'greaterThanOrEqual',
      ];
      if (enums.indexOf(opts.operator) < 0) {
        throw new TypeError(
          'DataValidation operator must be one of ' + enums.join(', '),
        );
      }
      this.operator = opts.operator;
    }

    if (opts.prompt !== undefined) {
      if (typeof opts.prompt !== 'string') {
        throw new TypeError('DataValidation prompt must be a string');
      }
      this.prompt = opts.prompt;
      this.showInputMessage = opts.showInputMessage = true;
    }

    if (opts.promptTitle !== undefined) {
      if (typeof opts.promptTitle !== 'string') {
        throw new TypeError('DataValidation promptTitle must be a string');
      }
      this.promptTitle = opts.promptTitle;
      this.showInputMessage = opts.showInputMessage = true;
    }

    if (opts.showDropDown !== undefined) {
      if (Number(opts.showDropDown) === 1) {
        opts.showDropDown = true;
      }
      if (Number(opts.showDropDown) === 0) {
        opts.showDropDown = false;
      }
      if (typeof opts.showDropDown !== 'boolean') {
        throw new TypeError(
          'DataValidation showDropDown must be true, false, 1 or 0',
        );
      }
      this.showDropDown = opts.showDropDown;
    }

    if (opts.showErrorMessage !== undefined) {
      if (Number(opts.showErrorMessage) === 1) {
        opts.showErrorMessage = true;
      }
      if (Number(opts.showErrorMessage) === 0) {
        opts.showErrorMessage = false;
      }
      if (typeof opts.showErrorMessage !== 'boolean') {
        throw new TypeError(
          'DataValidation showErrorMessage must be true, false, 1 or 0',
        );
      }
      this.showErrorMessage = opts.showErrorMessage;
    }

    if (opts.showInputMessage !== undefined) {
      if (Number(opts.showInputMessage) === 1) {
        opts.showInputMessage = true;
      }
      if (Number(opts.showInputMessage) === 0) {
        opts.showInputMessage = false;
      }
      if (typeof opts.showInputMessage !== 'boolean') {
        throw new TypeError(
          'DataValidation showInputMessage must be true, false, 1 or 0',
        );
      }
      this.showInputMessage = opts.showInputMessage;
    }

    if (opts.type !== undefined) {
      const enums = [
        'none',
        'whole',
        'decimal',
        'list',
        'date',
        'time',
        'textLength',
        'custom',
      ];
      if (enums.indexOf(opts.type) < 0) {
        throw new TypeError(
          'DataValidation type must be one of ' + enums.join(', '),
        );
      }
      this.type = opts.type;
    }
  }

  addToXMLele(ele) {
    const valEle = ele.ele('dataValidation');
    this.type !== undefined ? valEle.att('type', this.type) : null;
    this.errorStyle !== undefined
      ? valEle.att('errorStyle', this.errorStyle)
      : null;
    this.imeMode !== undefined ? valEle.att('imeMode', this.imeMode) : null;
    this.operator !== undefined ? valEle.att('operator', this.operator) : null;
    this.allowBlank !== undefined
      ? valEle.att('allowBlank', myUtils.boolToInt(this.allowBlank))
      : null;

    /**
     * For some reason, the Excel app sets this property to true if the "In-cell dropdown"
     * option is selected in the data validation screen.
     */
    this.showDropDown === false ? valEle.att('showDropDown', 1) : null;
    this.showInputMessage !== undefined
      ? valEle.att('showInputMessage', myUtils.boolToInt(this.showInputMessage))
      : null;
    this.showErrorMessage !== undefined
      ? valEle.att('showErrorMessage', myUtils.boolToInt(this.showErrorMessage))
      : null;
    this.errorTitle !== undefined
      ? valEle.att('errorTitle', this.errorTitle)
      : null;
    this.error !== undefined ? valEle.att('error', this.error) : null;
    this.promptTitle !== undefined
      ? valEle.att('promptTitle', this.promptTitle)
      : null;
    this.prompt !== undefined ? valEle.att('prompt', this.prompt) : null;
    this.sqref !== undefined ? valEle.att('sqref', this.sqref) : null;
    if (this.formula1 !== undefined) {
      valEle.ele('formula1').text(cleanFormula(this.formula1));
      if (this.formula2 !== undefined) {
        valEle.up();
        valEle.ele('formula2').text(cleanFormula(this.formula2));
      }
    }
    valEle.up();
  }
}

export class DataValidationCollection {
  private items;

  // §18.3.1.33 dataValidations (Data Validations)
  constructor(opts = {}) {
    this.items = [];
  }

  get length() {
    return this.items.length;
  }

  add(opts) {
    const thisValidation = new DataValidation(opts);
    this.items.push(thisValidation);
    return thisValidation;
  }

  addToXMLele(ele) {
    const valsEle = ele.ele('dataValidations').att('count', this.length);
    this.items.forEach((val) => {
      val.addToXMLele(valsEle);
      valsEle.up();
    });
  }
}