import { Injectable } from '@angular/core';
// Use dynamic imports for large CommonJS libraries to keep them out of the initial bundle
// Types are relaxed to `any` after dynamic import to avoid compile-time import side-effects

@Injectable({
  providedIn: 'root'
})
export class ExcelExportService {
  constructor() {}

  /**
   * Create a workbook with formatted header including GC and OSWS logos
   * @param sheetName - Name of the worksheet
   * @param columnCount - Number of columns for the data (to span header properly)
   * @returns Promise<ExcelJS.Workbook>
   */
  async createWorkbookWithHeader(sheetName: string, columnCount: number = 9): Promise<any> {
    let ExcelJS: any;
    try {
      if (typeof (window as any).ExcelJS !== 'undefined') {
        ExcelJS = (window as any).ExcelJS;
      } else {
        ExcelJS = await import('exceljs');
      }
    } catch (e) {
      throw new Error('Failed to load ExcelJS library: ' + (e && (e as any).message ? (e as any).message : e));
    }
    const Workbook = (ExcelJS as any).Workbook || (ExcelJS as any).default?.Workbook || (ExcelJS as any).default || ExcelJS;
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    // Load logos
    const gcLogoResponse = await fetch('/GC-Logo.png');
    const gcLogoBlob = await gcLogoResponse.blob();
    const gcLogoBuffer = await gcLogoBlob.arrayBuffer();

    const oswsLogoResponse = await fetch('/OSWS.png');
    const oswsLogoBlob = await oswsLogoResponse.blob();
    const oswsLogoBuffer = await oswsLogoBlob.arrayBuffer();

    // Add GC Logo (left side)
    const gcLogoId = workbook.addImage({
      buffer: gcLogoBuffer,
      extension: 'png',
    });

    // Add OSWS Logo (right side)
    const oswsLogoId = workbook.addImage({
      buffer: oswsLogoBuffer,
      extension: 'png',
    });

    // Calculate logo positions
    const lastCol = Math.max(columnCount - 1, 8);
    const oswsStartCol = Math.max(lastCol - 1, 7);
    
    // Insert GC logo - left side, maintaining aspect ratio
    // Measure image natural sizes so we can preserve aspect ratio
    const measureImage = async (buffer: ArrayBuffer) => {
      const blob = new Blob([buffer]);
      const url = URL.createObjectURL(blob);
      try {
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = (e) => reject(e);
          img.src = url;
        });
        return { width: img.naturalWidth, height: img.naturalHeight };
      } finally {
        URL.revokeObjectURL(url);
      }
    };

    const gcSize = await measureImage(gcLogoBuffer);
    const oswsSize = await measureImage(oswsLogoBuffer);

    // Desired logo display height in pixels (tweakable)
    const logoDisplayHeight = 110;
    // Use the same display height for both logos to align vertically
    const oswsDisplayHeight = logoDisplayHeight;

    // Compute width preserving aspect ratio
    const gcDisplayWidth = Math.round((gcSize.width / gcSize.height) * logoDisplayHeight);
    const oswsDisplayWidth = Math.round((oswsSize.width / oswsSize.height) * oswsDisplayHeight);

    // Insert GC logo using explicit pixel ext to preserve aspect ratio
    worksheet.addImage(gcLogoId, {
      tl: { col: 0, row: 0 } as any,
      ext: { width: gcDisplayWidth, height: logoDisplayHeight } as any,
      editAs: 'oneCell'
    });

    // Insert OSWS logo using explicit pixel ext, align vertically with GC and nudge left toward text
    worksheet.addImage(oswsLogoId, {
      tl: { col: 7.4, row: 0 } as any,
      ext: { width: oswsDisplayWidth, height: oswsDisplayHeight } as any,
      editAs: 'oneCell'
    });
    worksheet.mergeCells('C1:G1');
    worksheet.mergeCells('C2:G2');
    worksheet.mergeCells('C3:G3');
    worksheet.mergeCells('C4:G4');
    worksheet.mergeCells('C5:G5');

    // Add header text
    const headerRow1 = worksheet.getCell('C1');
    headerRow1.value = 'REPUBLIC OF THE PHILIPPINES';
    headerRow1.font = { bold: true, size: 11 };
    headerRow1.alignment = { horizontal: 'center', vertical: 'middle' };

    const headerRow2 = worksheet.getCell('C2');
    headerRow2.value = 'CITY OF OLONGAPO';
    headerRow2.font = { bold: true, size: 11 };
    headerRow2.alignment = { horizontal: 'center', vertical: 'middle' };

    const headerRow3 = worksheet.getCell('C3');
    headerRow3.value = 'GORDON COLLEGE';
    headerRow3.font = { bold: true, size: 12 };
    headerRow3.alignment = { horizontal: 'center', vertical: 'middle' };

    const headerRow4 = worksheet.getCell('C4');
    headerRow4.value = 'Olongapo City Sports Complex, Donor Street, East Tapinac, Olongapo City';
    headerRow4.font = { size: 9 };
    headerRow4.alignment = { horizontal: 'center', vertical: 'middle' };

    const headerRow5 = worksheet.getCell('C5');
    headerRow5.value = 'www.gordoncollege.edu.ph';
    headerRow5.font = { size: 9, color: { argb: '0563C1' }, underline: true };
    headerRow5.alignment = { horizontal: 'center', vertical: 'middle' };

    // Set row heights for header
    for (let i = 1; i <= 5; i++) {
      worksheet.getRow(i).height = 20;
    }

    // Add empty row after header
    worksheet.addRow([]);

    return workbook;
  }

  /**
   * Helper method to convert column index to Excel column letter
   */
  private getColumnLetter(columnIndex: number): string {
    let letter = '';
    let temp = columnIndex;
    
    while (temp >= 0) {
      letter = String.fromCharCode((temp % 26) + 65) + letter;
      temp = Math.floor(temp / 26) - 1;
    }
    
    return letter;
  }

  /**
   * Add data rows to worksheet starting after the header
   * @param worksheet - The worksheet to add data to
   * @param headers - Column headers
   * @param data - Array of data rows
   * @param startRow - Starting row number (default 7, after header + blank row)
   */
  addDataToWorksheet(
    worksheet: any,
    headers: string[],
    data: any[][],
    startRow: number = 7
  ): void {
    // Add column headers
    const headerRow = worksheet.getRow(startRow);
    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = header;
      cell.font = { bold: true, size: 11 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9E1F2' }
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // Add data rows
    data.forEach((row, rowIndex) => {
      const excelRow = worksheet.getRow(startRow + 1 + rowIndex);
      row.forEach((value, colIndex) => {
        const cell = excelRow.getCell(colIndex + 1);
        cell.value = value;
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        cell.alignment = { vertical: 'middle' };
      });
    });

    // Auto-fit columns
    worksheet.columns.forEach((column: any, index: number) => {
      let maxLength = headers[index]?.length || 10;
      data.forEach((row: any[]) => {
        const cellValue = String(row[index] || '');
        maxLength = Math.max(maxLength, cellValue.length);
      });
      column.width = Math.min(maxLength + 2, 50);
    });
  }

  /**
   * Export workbook to Excel file
   * @param workbook - The workbook to export
   * @param filename - Name of the file
   */
  async exportWorkbook(workbook: any, filename: string): Promise<void> {
    let saveAsFn: any;
    try {
      if (typeof (window as any).saveAs !== 'undefined') {
        saveAsFn = (window as any).saveAs;
      } else {
        const fs = await import('file-saver');
        saveAsFn = (fs as any).saveAs || (fs as any).default || fs;
      }
    } catch (e) {
      throw new Error('Failed to load file-saver library: ' + (e && (e as any).message ? (e as any).message : e));
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    (saveAsFn as any)(blob, filename);
  }

  /**
   * Complete helper: Create Excel with header and data in one call
   * @param sheetName - Name of the worksheet
   * @param headers - Column headers
   * @param data - Array of data rows
   * @param filename - Output filename
   */
  async createAndExportExcel(
    sheetName: string,
    headers: string[],
    data: any[][],
    filename: string
  ): Promise<void> {
    const columnCount = headers.length;
    const workbook = await this.createWorkbookWithHeader(sheetName, columnCount);
    const worksheet = workbook.getWorksheet(sheetName);
    
    if (worksheet) {
      this.addDataToWorksheet(worksheet, headers, data);
      await this.exportWorkbook(workbook, filename);
    }
  }
}
