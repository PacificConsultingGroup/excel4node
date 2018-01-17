import * as xmlbuilder from 'xmlbuilder';
import * as utils from '../utils';
import * as types from '../types/index';
import { Hyperlink } from './classes/hyperlink';
import { Picture } from '../drawing/picture';

const _addSheetPr = (promiseObj) => {
  // §18.3.1.82 sheetPr (Sheet Properties)
  return new Promise((resolve, reject) => {
    const o = promiseObj.ws.opts;

    // Check if any option that would require the sheetPr element to be added exists
    if (
      o.printOptions.fitToHeight !== null ||
      o.printOptions.fitToWidth !== null ||
      o.outline.summaryBelow !== null ||
      o.autoFilter.ref !== null ||
      o.outline.summaryRight
    ) {
      const ele = promiseObj.xml.ele('sheetPr');

      if (o.autoFilter.ref) {
        ele.att('enableFormatConditionsCalculation', 1);
        ele.att('filterMode', 1);
      }

      if (o.outline.summaryBelow !== null || o.outline.summaryRight !== null) {
        const outlineEle = ele.ele('outlinePr');
        outlineEle.att('applyStyles', 1);
        outlineEle.att('summaryBelow', o.outline.summaryBelow === true ? 1 : 0);
        outlineEle.att('summaryRight', o.outline.summaryRight === true ? 1 : 0);
        outlineEle.up();
      }

      // §18.3.1.65 pageSetUpPr (Page Setup Properties)
      if (o.pageSetup.fitToHeight !== null || o.pageSetup.fitToWidth !== null) {
        ele
          .ele('pageSetUpPr')
          .att('fitToPage', 1)
          .up();
      }
      ele.up();
    }

    resolve(promiseObj);
  });
};

const _addDimension = (promiseObj) => {
  // §18.3.1.35 dimension (Worksheet Dimensions)
  return new Promise((resolve, reject) => {
    const firstCell = 'A1';
    const lastCell = `${utils.getExcelAlpha(promiseObj.ws.lastUsedCol)}${
      promiseObj.ws.lastUsedRow
    }`;
    const ele = promiseObj.xml.ele('dimension');
    ele.att('ref', `${firstCell}:${lastCell}`);
    ele.up();

    resolve(promiseObj);
  });
};

const _addSheetViews = (promiseObj) => {
  // §18.3.1.88 sheetViews (Sheet Views)
  return new Promise((resolve, reject) => {
    const o = promiseObj.ws.opts.sheetView;
    const ele = promiseObj.xml.ele('sheetViews');
    const tabSelected = promiseObj.ws.opts;
    const sv = ele
      .ele('sheetView')
      .att('showGridLines', o.showGridLines)
      .att('tabSelected', o.tabSelected)
      .att('workbookViewId', o.workbookViewId)
      .att('rightToLeft', o.rightToLeft)
      .att('zoomScale', o.zoomScale)
      .att('zoomScaleNormal', o.zoomScaleNormal)
      .att('zoomScalePageLayoutView', o.zoomScalePageLayoutView);

    const modifiedPaneParams = [];
    Object.keys(o.pane).forEach((k) => {
      if (o.pane[k] !== null) {
        modifiedPaneParams.push(k);
      }
    });
    if (modifiedPaneParams.length > 0) {
      const pEle = sv.ele('pane');
      o.pane.xSplit !== null ? pEle.att('xSplit', o.pane.xSplit) : null;
      o.pane.ySplit !== null ? pEle.att('ySplit', o.pane.ySplit) : null;
      o.pane.topLeftCell !== null
        ? pEle.att('topLeftCell', o.pane.topLeftCell)
        : null;
      o.pane.activePane !== null
        ? pEle.att('activePane', o.pane.activePane)
        : null;
      o.pane.state !== null ? pEle.att('state', o.pane.state) : null;
      pEle.up();
    }
    sv.up();
    ele.up();
    resolve(promiseObj);
  });
};

const _addSheetFormatPr = (promiseObj) => {
  // §18.3.1.81 sheetFormatPr (Sheet Format Properties)
  return new Promise((resolve, reject) => {
    const o = promiseObj.ws.opts.sheetFormat;
    const ele = promiseObj.xml.ele('sheetFormatPr');

    o.baseColWidth !== null ? ele.att('baseColWidth', o.baseColWidth) : null;
    o.defaultColWidth !== null
      ? ele.att('defaultColWidth', o.defaultColWidth)
      : null;
    o.defaultRowHeight !== null
      ? ele.att('defaultRowHeight', o.defaultRowHeight)
      : ele.att('defaultRowHeight', 16);
    o.thickBottom !== null
      ? ele.att('thickBottom', utils.boolToInt(o.thickBottom))
      : null;
    o.thickTop !== null
      ? ele.att('thickTop', utils.boolToInt(o.thickTop))
      : null;

    if (typeof o.defaultRowHeight === 'number') {
      ele.att('customHeight', '1');
    }
    ele.up();
    resolve(promiseObj);
  });
};

const _addCols = (promiseObj) => {
  // §18.3.1.17 cols (Column Information)
  return new Promise((resolve, reject) => {
    if (promiseObj.ws.columnCount > 0) {
      const colsEle = promiseObj.xml.ele('cols');

      for (const colId in promiseObj.ws.cols) {
        const col = promiseObj.ws.cols[colId];
        const colEle = colsEle.ele('col');

        col.min !== null ? colEle.att('min', col.min) : null;
        col.max !== null ? colEle.att('max', col.max) : null;
        col.width !== null ? colEle.att('width', col.width) : null;
        col.style !== null ? colEle.att('style', col.style) : null;
        col.hidden !== null
          ? colEle.att('hidden', utils.boolToInt(col.hidden))
          : null;
        col.customWidth !== null
          ? colEle.att('customWidth', utils.boolToInt(col.customWidth))
          : null;
        col.outlineLevel !== null
          ? colEle.att('outlineLevel', col.outlineLevel)
          : null;
        col.collapsed !== null
          ? colEle.att('collapsed', utils.boolToInt(col.collapsed))
          : null;
        colEle.up();
      }
      colsEle.up();
    }

    resolve(promiseObj);
  });
};

const _addSheetData = (promiseObj) => {
  // §18.3.1.80 sheetData (Sheet Data)
  return new Promise((resolve, reject) => {
    const ele = promiseObj.xml.ele('sheetData');
    const rows = Object.keys(promiseObj.ws.rows);

    const processRows = (theseRows) => {
      for (let r = 0; r < theseRows.length; r += 1) {
        const thisRow = promiseObj.ws.rows[theseRows[r]];
        thisRow.cellRefs.sort(utils.sortCellRefs);

        const rEle = ele.ele('row');

        rEle.att('r', thisRow.r);
        rEle.att('spans', thisRow.spans);
        thisRow.s !== null ? rEle.att('s', thisRow.s) : null;
        thisRow.customFormat !== null
          ? rEle.att('customFormat', thisRow.customFormat)
          : null;
        thisRow.ht !== null ? rEle.att('ht', thisRow.ht) : null;
        thisRow.hidden !== null ? rEle.att('hidden', thisRow.hidden) : null;
        thisRow.customHeight === true ||
        typeof promiseObj.ws.opts.sheetFormat.defaultRowHeight === 'number'
          ? rEle.att('customHeight', 1)
          : null;
        thisRow.outlineLevel !== null
          ? rEle.att('outlineLevel', thisRow.outlineLevel)
          : null;
        thisRow.collapsed !== null
          ? rEle.att('collapsed', thisRow.collapsed)
          : null;
        thisRow.thickTop !== null
          ? rEle.att('thickTop', thisRow.thickTop)
          : null;
        thisRow.thickBot !== null
          ? rEle.att('thickBot', thisRow.thickBot)
          : null;

        for (let i = 0; i < thisRow.cellRefs.length; i += 1) {
          promiseObj.ws.cells[thisRow.cellRefs[i]].addToXMLele(rEle);
        }

        rEle.up();
      }

      processNextRows();
    };

    const processNextRows = () => {
      const theseRows = rows.splice(0, 500);
      if (theseRows.length === 0) {
        ele.up();
        return resolve(promiseObj);
      }
      processRows(theseRows);
    };

    processNextRows();
  });
};

const _addSheetProtection = (promiseObj) => {
  // §18.3.1.85 sheetProtection (Sheet Protection Options)
  return new Promise((resolve, reject) => {
    const o = promiseObj.ws.opts.sheetProtection;
    let includeSheetProtection = false;
    Object.keys(o).forEach((k) => {
      if (o[k] !== null) {
        includeSheetProtection = true;
      }
    });

    if (includeSheetProtection) {
      // Set required fields with defaults if not specified
      o.sheet = o.sheet !== null ? o.sheet : true;
      o.objects = o.objects !== null ? o.objects : true;
      o.scenarios = o.scenarios !== null ? o.scenarios : true;

      const ele = promiseObj.xml.ele('sheetProtection');
      Object.keys(o).forEach((k) => {
        if (o[k] !== null) {
          if (k === 'password') {
            ele.att('password', utils.getHashOfPassword(o[k]));
          } else {
            ele.att(k, utils.boolToInt(o[k]));
          }
        }
      });
      ele.up();
    }
    resolve(promiseObj);
  });
};

const _addAutoFilter = (promiseObj) => {
  // §18.3.1.2 autoFilter (AutoFilter Settings)
  return new Promise((resolve, reject) => {
    const o = promiseObj.ws.opts.autoFilter;

    if (typeof o.startRow === 'number') {
      const ele = promiseObj.xml.ele('autoFilter');
      const filterRow = promiseObj.ws.rows[o.startRow];

      o.startCol = typeof o.startCol === 'number' ? o.startCol : null;
      o.endCol = typeof o.endCol === 'number' ? o.endCol : null;

      if (typeof o.endRow !== 'number') {
        let firstEmptyRow = undefined;
        let curRow = o.startRow;
        while (firstEmptyRow === undefined) {
          if (!promiseObj.ws.rows[curRow]) {
            firstEmptyRow = curRow;
          } else {
            curRow += 1;
          }
        }

        o.endRow = firstEmptyRow - 1;
      }

      // Columns to sort not manually set. filter all columns in this row containing data.
      if (typeof o.startCol !== 'number' || typeof o.endCol !== 'number') {
        o.startCol = filterRow.firstColumn;
        o.endCol = filterRow.lastColumn;
      }

      const startCell = utils.getExcelAlpha(o.startCol) + o.startRow;
      const endCell = utils.getExcelAlpha(o.endCol) + o.endRow;

      ele.att('ref', `${startCell}:${endCell}`);
      promiseObj.ws.wb.definedNameCollection.addDefinedName({
        hidden: 1,
        localSheetId: promiseObj.ws.localSheetId,
        name: '_xlnm._FilterDatabase',
        refFormula:
          // tslint:disable-next-line:quotemark
          "'" +
          promiseObj.ws.name +
          // tslint:disable-next-line:quotemark
          "'!" +
          '$' +
          utils.getExcelAlpha(o.startCol) +
          '$' +
          o.startRow +
          ':' +
          '$' +
          utils.getExcelAlpha(o.endCol) +
          '$' +
          o.endRow,
      });
      ele.up();
    }
    resolve(promiseObj);
  });
};

const _addMergeCells = (promiseObj) => {
  // §18.3.1.55 mergeCells (Merge Cells)
  return new Promise((resolve, reject) => {
    if (
      promiseObj.ws.mergedCells instanceof Array &&
      promiseObj.ws.mergedCells.length > 0
    ) {
      const ele = promiseObj.xml
        .ele('mergeCells')
        .att('count', promiseObj.ws.mergedCells.length);
      promiseObj.ws.mergedCells.forEach((cr) => {
        ele
          .ele('mergeCell')
          .att('ref', cr)
          .up();
      });
      ele.up();
    }

    resolve(promiseObj);
  });
};

const _addConditionalFormatting = (promiseObj) => {
  // §18.3.1.18 conditionalFormatting (Conditional Formatting)
  return new Promise((resolve, reject) => {
    promiseObj.ws.cfRulesCollection.addToXMLele(promiseObj.xml);
    resolve(promiseObj);
  });
};

const _addHyperlinks = (promiseObj) => {
  // §18.3.1.48 hyperlinks (Hyperlinks)
  return new Promise((resolve, reject) => {
    promiseObj.ws.hyperlinkCollection.addToXMLele(promiseObj.xml);
    resolve(promiseObj);
  });
};

const _addDataValidations = (promiseObj) => {
  // §18.3.1.33 dataValidations (Data Validations)
  return new Promise((resolve, reject) => {
    if (promiseObj.ws.dataValidationCollection.length > 0) {
      promiseObj.ws.dataValidationCollection.addToXMLele(promiseObj.xml);
    }
    resolve(promiseObj);
  });
};

const _addPrintOptions = (promiseObj) => {
  // §18.3.1.70 printOptions (Print Options)
  return new Promise((resolve, reject) => {
    let addPrintOptions = false;
    const o = promiseObj.ws.opts.printOptions;
    Object.keys(o).forEach((k) => {
      if (o[k] !== null) {
        addPrintOptions = true;
      }
    });

    if (addPrintOptions) {
      const poEle = promiseObj.xml.ele('printOptions');
      o.centerHorizontal === true ? poEle.att('horizontalCentered', 1) : null;
      o.centerVertical === true ? poEle.att('verticalCentered', 1) : null;
      o.printHeadings === true ? poEle.att('headings', 1) : null;
      if (o.printGridLines === true) {
        poEle.att('gridLines', 1);
        poEle.att('gridLinesSet', 1);
      }
      poEle.up();
    }

    resolve(promiseObj);
  });
};

const _addPageMargins = (promiseObj) => {
  // §18.3.1.62 pageMargins (Page Margins)
  return new Promise((resolve, reject) => {
    const o = promiseObj.ws.opts.margins;

    promiseObj.xml
      .ele('pageMargins')
      .att('left', o.left)
      .att('right', o.right)
      .att('top', o.top)
      .att('bottom', o.bottom)
      .att('header', o.header)
      .att('footer', o.footer)
      .up();

    resolve(promiseObj);
  });
};

const _addPageSetup = (promiseObj) => {
  // §18.3.1.63 pageSetup (Page Setup Settings)
  return new Promise((resolve, reject) => {
    let addPageSetup = false;
    const o = promiseObj.ws.opts.pageSetup;
    Object.keys(o).forEach((k) => {
      if (o[k] !== null) {
        addPageSetup = true;
      }
    });

    if (addPageSetup) {
      const psEle = promiseObj.xml.ele('pageSetup');
      o.paperSize !== null
        ? psEle.att('paperSize', types.paperSize[o.paperSize])
        : null;
      o.paperHeight !== null ? psEle.att('paperHeight', o.paperHeight) : null;
      o.paperWidth !== null ? psEle.att('paperWidth', o.paperWidth) : null;
      o.scale !== null ? psEle.att('scale', o.scale) : null;
      o.firstPageNumber !== null
        ? psEle.att('firstPageNumber', o.firstPageNumber)
        : null;
      o.fitToWidth !== null ? psEle.att('fitToWidth', o.fitToWidth) : null;
      o.fitToHeight !== null ? psEle.att('fitToHeight', o.fitToHeight) : null;
      o.pageOrder !== null ? psEle.att('pageOrder', o.pageOrder) : null;
      o.orientation !== null ? psEle.att('orientation', o.orientation) : null;
      o.usePrinterDefaults !== null
        ? psEle.att('usePrinterDefaults', utils.boolToInt(o.usePrinterDefaults))
        : null;
      o.blackAndWhite !== null
        ? psEle.att('blackAndWhite', utils.boolToInt(o.blackAndWhite))
        : null;
      o.draft !== null ? psEle.att('draft', utils.boolToInt(o.draft)) : null;
      o.cellComments !== null
        ? psEle.att('cellComments', o.cellComments)
        : null;
      o.useFirstPageNumber !== null
        ? psEle.att('useFirstPageNumber', utils.boolToInt(o.useFirstPageNumber))
        : null;
      o.errors !== null ? psEle.att('errors', o.errors) : null;
      o.horizontalDpi !== null
        ? psEle.att('horizontalDpi', o.horizontalDpi)
        : null;
      o.verticalDpi !== null ? psEle.att('verticalDpi', o.verticalDpi) : null;
      o.copies !== null ? psEle.att('copies', o.copies) : null;
      psEle.up();
    }

    resolve(promiseObj);
  });
};

const _addHeaderFooter = (promiseObj) => {
  // §18.3.1.46 headerFooter (Header Footer Settings)
  return new Promise((resolve, reject) => {
    let addHeaderFooter = false;
    const o = promiseObj.ws.opts.headerFooter;
    Object.keys(o).forEach((k) => {
      if (o[k] !== null) {
        addHeaderFooter = true;
      }
    });

    if (addHeaderFooter) {
      const hfEle = promiseObj.xml.ele('headerFooter');

      o.alignWithMargins !== null
        ? hfEle.att('alignWithMargins', utils.boolToInt(o.alignWithMargins))
        : null;
      o.differentFirst !== null
        ? hfEle.att('differentFirst', utils.boolToInt(o.differentFirst))
        : null;
      o.differentOddEven !== null
        ? hfEle.att('differentOddEven', utils.boolToInt(o.differentOddEven))
        : null;
      o.scaleWithDoc !== null
        ? hfEle.att('scaleWithDoc', utils.boolToInt(o.scaleWithDoc))
        : null;

      o.oddHeader !== null
        ? hfEle
            .ele('oddHeader')
            .text(o.oddHeader)
            .up()
        : null;
      o.oddFooter !== null
        ? hfEle
            .ele('oddFooter')
            .text(o.oddFooter)
            .up()
        : null;
      o.evenHeader !== null
        ? hfEle
            .ele('evenHeader')
            .text(o.evenHeader)
            .up()
        : null;
      o.evenFooter !== null
        ? hfEle
            .ele('evenFooter')
            .text(o.evenFooter)
            .up()
        : null;
      o.firstHeader !== null
        ? hfEle
            .ele('firstHeader')
            .text(o.firstHeader)
            .up()
        : null;
      o.firstFooter !== null
        ? hfEle
            .ele('firstFooter')
            .text(o.firstFooter)
            .up()
        : null;
      hfEle.up();
    }

    resolve(promiseObj);
  });
};

const _addDrawing = (promiseObj) => {
  // §18.3.1.36 drawing (Drawing)
  return new Promise((resolve, reject) => {
    if (!promiseObj.ws.drawingCollection.isEmpty) {
      const dId = promiseObj.ws.relationships.indexOf('drawing') + 1;
      promiseObj.xml
        .ele('drawing')
        .att('r:id', 'rId' + dId)
        .up();
    }
    resolve(promiseObj);
  });
};

export function sheetXML(ws) {
  return new Promise((resolve, reject) => {
    const xmlProlog = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
    let xmlString = '';
    const wsXML = xmlbuilder
      .begin((chunk) => {
        xmlString += chunk;
      })
      .ele('worksheet')
      .att('mc:Ignorable', 'x14ac')
      .att('xmlns', 'http://schemas.openxmlformats.org/spreadsheetml/2006/main')
      .att(
        'xmlns:mc',
        'http://schemas.openxmlformats.org/markup-compatibility/2006',
      )
      .att(
        'xmlns:r',
        'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
      )
      .att(
        'xmlns:x14ac',
        'http://schemas.microsoft.com/office/spreadsheetml/2009/9/ac',
      );

    // Excel complains if specific elements on not in the correct order in the XML doc.
    const promiseObj = { ws, xml: wsXML };

    _addSheetPr(promiseObj)
      .then(_addDimension)
      .then(_addSheetViews)
      .then(_addSheetFormatPr)
      .then(_addCols)
      .then(_addSheetData)
      .then(_addSheetProtection)
      .then(_addAutoFilter)
      .then(_addMergeCells)
      .then(_addConditionalFormatting)
      .then(_addDataValidations)
      .then(_addHyperlinks)
      .then(_addPrintOptions)
      .then(_addPageMargins)
      .then(_addPageSetup)
      .then(_addHeaderFooter)
      .then(_addDrawing)
      .then((promiseObj) => {
        return new Promise((resolve, reject) => {
          wsXML.end();
          resolve(xmlString);
        });
      })
      .then((xml) => {
        resolve(xml);
      })
      .catch((e) => {
        throw new Error(e.stack);
      });
  });
}

export function relsXML(ws) {
  return new Promise((resolve, reject) => {
    let sheetRelRequired = false;
    if (ws.relationships.length > 0) {
      sheetRelRequired = true;
    }

    if (!sheetRelRequired) {
      resolve();
    }

    const relXML = xmlbuilder.create('Relationships', {
      version: '1.0',
      encoding: 'UTF-8',
      standalone: true,
    });
    relXML.att(
      'xmlns',
      'http://schemas.openxmlformats.org/package/2006/relationships',
    );

    ws.relationships.forEach((r, i) => {
      const rId = 'rId' + (i + 1);
      if (r instanceof Hyperlink) {
        relXML
          .ele('Relationship')
          .att('Id', rId)
          .att('Target', r.location)
          .att('TargetMode', 'External')
          .att(
            'Type',
            'http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink',
          );
      } else if (r === 'drawing') {
        relXML
          .ele('Relationship')
          .att('Id', rId)
          .att('Target', '../drawings/drawing' + ws.sheetId + '.xml')
          .att(
            'Type',
            'http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing',
          );
      }
    });
    const xmlString = relXML.doc().end();
    resolve(xmlString);
  });
}