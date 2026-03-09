import { useState } from 'react';
import { Download, FileSpreadsheet, Printer, ChevronDown } from 'lucide-react';
import ExcelJS from 'exceljs';
import { formatCurrency } from '../../../../utils/currency';

interface ExportData {
  salesData?: any;
  paymentData?: any;
  productData?: any;
  movementsData?: any;
  from: string;
  to: string;
}

export function ExportButton({ data }: { data: ExportData }) {
  const [open, setOpen] = useState(false);

  const exportExcel = async () => {
    setOpen(false);
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'RestoPOS';

    // Sales sheet
    if (data.salesData?.data?.length) {
      const sheet = workbook.addWorksheet('Ventas');
      sheet.columns = [
        { header: 'Período', key: 'label', width: 20 },
        { header: 'Ingresos (₲)', key: 'revenue', width: 20 },
        { header: 'Pedidos', key: 'orderCount', width: 12 },
        { header: 'Ticket Promedio (₲)', key: 'averageTicket', width: 20 },
      ];
      sheet.getRow(1).font = { bold: true };
      data.salesData.data.forEach((row: any) => sheet.addRow(row));
    }

    // Products sheet
    if (data.productData?.data?.length) {
      const sheet = workbook.addWorksheet('Productos');
      sheet.columns = [
        { header: 'Producto', key: 'productName', width: 25 },
        { header: 'Variante', key: 'variantName', width: 20 },
        { header: 'Cantidad', key: 'quantity', width: 12 },
        { header: 'Ingresos (₲)', key: 'revenue', width: 20 },
      ];
      sheet.getRow(1).font = { bold: true };
      data.productData.data.forEach((row: any) => sheet.addRow(row));
    }

    // Payments sheet
    if (data.paymentData?.data?.length) {
      const sheet = workbook.addWorksheet('Pagos');
      sheet.columns = [
        { header: 'Método', key: 'method', width: 20 },
        { header: 'Total (₲)', key: 'total', width: 20 },
        { header: 'Transacciones', key: 'transactionCount', width: 15 },
        { header: 'Porcentaje', key: 'percentage', width: 12 },
      ];
      sheet.getRow(1).font = { bold: true };
      data.paymentData.data.forEach((row: any) => sheet.addRow(row));
    }

    // Movements sheet
    if (data.movementsData?.recentMovements?.length) {
      const sheet = workbook.addWorksheet('Movimientos');
      sheet.columns = [
        { header: 'Tipo', key: 'type', width: 12 },
        { header: 'Descripción', key: 'description', width: 30 },
        { header: 'Monto (₲)', key: 'amount', width: 20 },
        { header: 'Fecha', key: 'createdAt', width: 20 },
      ];
      sheet.getRow(1).font = { bold: true };
      data.movementsData.recentMovements.forEach((row: any) =>
        sheet.addRow({
          ...row,
          type: row.type === 'INCOME' ? 'Ingreso' : 'Egreso',
          createdAt: new Date(row.createdAt).toLocaleString('es-PY'),
        }),
      );

      // Summary row
      sheet.addRow({});
      sheet.addRow({ type: 'RESUMEN', description: 'Total Ingresos', amount: data.movementsData.totalIncome });
      sheet.addRow({ type: '', description: 'Total Egresos', amount: data.movementsData.totalExpense });
      sheet.addRow({ type: '', description: 'Balance', amount: data.movementsData.balance });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_${data.from}_${data.to}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    setOpen(false);
    window.print();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-bold text-xs shadow-lg shadow-primary/20 hover:scale-105 transition-all"
      >
        <Download size={14} /> Exportar <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-surface border border-gray-100 dark:border-white/10 rounded-2xl shadow-xl z-50 overflow-hidden py-1">
            <button
              onClick={exportExcel}
              className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-secondary hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              <FileSpreadsheet size={16} className="text-success" /> Descargar Excel (.xlsx)
            </button>
            <button
              onClick={exportPDF}
              className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-secondary hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              <Printer size={16} className="text-primary" /> Imprimir / PDF
            </button>
          </div>
        </>
      )}
    </div>
  );
}
