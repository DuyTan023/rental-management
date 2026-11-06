// lib/services/landlord/invoice-pdf.service.ts

import PDFDocument from "pdfkit";
import path from "path";

import { invoicePdfRepository } from "@/lib/api/repositories/invoices/invoice-pdf.repository";

type InvoicePdfData = NonNullable<
  Awaited<ReturnType<typeof invoicePdfRepository.findById>>
>;

const FONT_REGULAR = path.join(
  process.cwd(),
  "public",
  "fonts",
  "DejaVuSans.ttf"
);

const FONT_BOLD = path.join(
  process.cwd(),
  "public",
  "fonts",
  "DejaVuSans-Bold.ttf"
);

function formatMoney(value: unknown): string {
  return `${Number(value ?? 0).toLocaleString("vi-VN")} đ`;
}

function formatDate(value: Date | null | undefined): string {
  if (!value) return "—";

  const day = String(value.getUTCDate()).padStart(2, "0");
  const month = String(value.getUTCMonth() + 1).padStart(2, "0");
  const year = value.getUTCFullYear();

  return `${day}/${month}/${year}`;
}

function formatQuantity(value: unknown): string {
  return Number(value ?? 0).toLocaleString("vi-VN", {
    maximumFractionDigits: 2,
  });
}

function getStatusLabel(status: string): string {
  const statuses: Record<string, string> = {
    UNPAID: "Chưa thanh toán",
    PARTIALLY_PAID: "Thanh toán một phần",
    PAID: "Đã thanh toán",
    OVERDUE: "Quá hạn",
    CANCELLED: "Đã hủy",
  };

  return statuses[status] ?? status;
}

function getRemainingAmount(invoice: InvoicePdfData): number {
  return Math.max(
    0,
    Number(invoice.total_amount) - Number(invoice.paid_amount)
  );
}

function drawDivider(doc: PDFKit.PDFDocument) {
  const x = 50;
  const width = doc.page.width - 100;

  doc
    .moveTo(x, doc.y)
    .lineTo(x + width, doc.y)
    .lineWidth(0.7)
    .strokeColor("#D1D5DB")
    .stroke();

  doc.moveDown(1);
}

function drawLabelValue(
  doc: PDFKit.PDFDocument,
  label: string,
  value: string,
  x: number,
  y: number,
  width = 250
) {
  doc
    .font("regular")
    .fontSize(9)
    .fillColor("#64748B")
    .text(label, x, y, {
      width,
    });

  doc
    .font("bold")
    .fontSize(9)
    .fillColor("#111827")
    .text(value, x, y + 15, {
      width,
    });
}

function ensureSpace(
  doc: PDFKit.PDFDocument,
  requiredHeight: number
) {
  const bottom = doc.page.height - 55;

  if (doc.y + requiredHeight > bottom) {
    doc.addPage();
  }
}

function drawTableHeader(doc: PDFKit.PDFDocument) {
  const x = 50;
  const y = doc.y;
  const widths = [30, 210, 65, 85, 105];

  doc
    .rect(x, y, widths.reduce((a, b) => a + b, 0), 28)
    .fill("#F1F5F9");

  doc.font("bold").fontSize(8).fillColor("#334155");

  const headers = [
    "STT",
    "Nội dung",
    "SL",
    "Đơn giá",
    "Thành tiền",
  ];

  let currentX = x;

  headers.forEach((header, index) => {
    doc.text(header, currentX + 5, y + 9, {
      width: widths[index] - 10,
      align: index === 0 || index === 2 ? "center" : "left",
    });

    currentX += widths[index];
  });

  doc.y = y + 28;

  return widths;
}

function drawInvoiceItems(
  doc: PDFKit.PDFDocument,
  invoice: InvoicePdfData
) {
  const widths = [30, 210, 65, 85, 105];
  const x = 50;

  doc.font("regular").fontSize(8).fillColor("#334155");

  invoice.invoice_items.forEach((item, index) => {
    const description = item.description || "Dịch vụ";
    const quantity = formatQuantity(item.quantity);
    const unitPrice = formatMoney(item.unit_price);
    const subtotal = formatMoney(item.subtotal);

    const descriptionHeight = doc.heightOfString(description, {
      width: widths[1] - 10,
    });

    const rowHeight = Math.max(32, descriptionHeight + 14);

    ensureSpace(doc, rowHeight + 10);

    // Khi sang trang mới, vẽ lại tiêu đề bảng.
    if (doc.y < 65) {
      doc.y = 50;
      drawTableHeader(doc);
    }

    const y = doc.y;
    const values = [
      String(index + 1),
      description,
      quantity,
      unitPrice,
      subtotal,
    ];

    let currentX = x;

    values.forEach((value, columnIndex) => {
      doc
        .font(columnIndex === 1 ? "regular" : "regular")
        .fontSize(8)
        .fillColor("#334155")
        .text(value, currentX + 5, y + 8, {
          width: widths[columnIndex] - 10,
          height: rowHeight - 8,
          align:
            columnIndex === 0 || columnIndex === 2
              ? "center"
              : columnIndex >= 3
                ? "right"
                : "left",
        });

      currentX += widths[columnIndex];
    });

    doc
      .moveTo(x, y + rowHeight)
      .lineTo(x + widths.reduce((a, b) => a + b, 0), y + rowHeight)
      .lineWidth(0.4)
      .strokeColor("#E2E8F0")
      .stroke();

    doc.y = y + rowHeight;
  });
}

function drawInvoiceSummary(
  doc: PDFKit.PDFDocument,
  invoice: InvoicePdfData
) {
  ensureSpace(doc, 140);

  const x = 340;
  const width = 210;

  const total = Number(invoice.total_amount);
  const paid = Number(invoice.paid_amount);
  const remaining = getRemainingAmount(invoice);

  doc.moveDown(1);

  const rows = [
    {
      label: "Tổng tiền",
      value: formatMoney(total),
      bold: true,
    },
    {
      label: "Đã thanh toán",
      value: formatMoney(paid),
      bold: false,
    },
    {
      label: "Còn phải thanh toán",
      value: formatMoney(remaining),
      bold: true,
    },
  ];

  rows.forEach((row) => {
    const y = doc.y;

    doc
      .font(row.bold ? "bold" : "regular")
      .fontSize(9)
      .fillColor("#334155")
      .text(row.label, x, y, {
        width: 120,
      });

    doc
      .font(row.bold ? "bold" : "regular")
      .fontSize(9)
      .fillColor("#111827")
      .text(row.value, x + 120, y, {
        width: width - 120,
        align: "right",
      });

    doc.moveDown(1.5);
  });
}

function buildInvoicePdf(invoice: InvoicePdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: {
        top: 45,
        bottom: 45,
        left: 50,
        right: 50,
      },
      bufferPages: true,
      info: {
        Title: `Hoa don ${invoice.invoice_number}`,
        Author: "Hệ thống quản lý phòng trọ",
        Subject: "Hóa đơn tiền phòng",
      },
    });

    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });

    doc.on("end", () => {
      resolve(Buffer.concat(chunks));
    });

    doc.on("error", reject);

    try {
      doc.registerFont("regular", FONT_REGULAR);
      doc.registerFont("bold", FONT_BOLD);

      const contract = invoice.rental_contracts;
      const room = contract.rooms;
      const tenants = contract.contract_tenants;

      // Header
      doc
        .font("bold")
        .fontSize(19)
        .fillColor("#0F172A")
        .text("HÓA ĐƠN TIỀN PHÒNG", {
          align: "center",
        });

      doc.moveDown(0.4);

      doc
        .font("regular")
        .fontSize(9)
        .fillColor("#64748B")
        .text("PHIẾU THANH TOÁN CHI PHÍ THUÊ PHÒNG", {
          align: "center",
        });

      doc.moveDown(1.5);

      drawDivider(doc);

      // Invoice information
      doc
        .font("bold")
        .fontSize(11)
        .fillColor("#0F172A")
        .text("THÔNG TIN HÓA ĐƠN");

      doc.moveDown(1);

      const leftX = 50;
      const rightX = 310;
      const startY = doc.y;

      drawLabelValue(
        doc,
        "Mã hóa đơn",
        invoice.invoice_number,
        leftX,
        startY
      );

      drawLabelValue(
        doc,
        "Kỳ thanh toán",
        `${invoice.billing_month}/${invoice.billing_year}`,
        rightX,
        startY
      );

      drawLabelValue(
        doc,
        "Ngày lập",
        formatDate(invoice.issue_date),
        leftX,
        startY + 48
      );

      drawLabelValue(
        doc,
        "Hạn thanh toán",
        formatDate(invoice.due_date),
        rightX,
        startY + 48
      );

      drawLabelValue(
        doc,
        "Trạng thái",
        getStatusLabel(invoice.status),
        leftX,
        startY + 96
      );

      doc.y = startY + 130;

      drawDivider(doc);

      // Contract and room
      doc
        .font("bold")
        .fontSize(11)
        .fillColor("#0F172A")
        .text("THÔNG TIN PHÒNG VÀ HỢP ĐỒNG");

      doc.moveDown(1);

      const contractY = doc.y;

      drawLabelValue(
        doc,
        "Mã hợp đồng",
        contract.contract_number,
        leftX,
        contractY
      );

      drawLabelValue(
        doc,
        "Phòng",
        room.room_number,
        rightX,
        contractY
      );

      drawLabelValue(
        doc,
        "Ngày bắt đầu",
        formatDate(contract.start_date),
        leftX,
        contractY + 48
      );

      drawLabelValue(
        doc,
        "Ngày kết thúc",
        formatDate(contract.end_date),
        rightX,
        contractY + 48
      );

      doc.y = contractY + 95;

      // Tenants
      doc
        .font("bold")
        .fontSize(11)
        .fillColor("#0F172A")
        .text("DANH SÁCH NGƯỜI THUÊ");

      doc.moveDown(0.5);

      tenants.forEach((tenant, index) => {
        const profile = tenant.profiles;

        const role =
          tenant.role === "REPRESENTATIVE"
            ? "Người đại diện"
            : "Thành viên";

        const left = `${index + 1}. ${profile.full_name} (${role})`;
        const right = profile.phone;

        doc
          .font("regular")
          .fontSize(9)
          .fillColor("#334155")
          .text(left, leftX, doc.y, {
            width: 300,
          });

        doc
          .font("regular")
          .fontSize(9)
          .fillColor("#334155")
          .text(right, 370, doc.y - 11, {
            width: 170,
            align: "right",
          });

        doc.moveDown(0.7);
      });

      drawDivider(doc);

      // Invoice items
      doc
        .font("bold")
        .fontSize(11)
        .fillColor("#0F172A")
        .text("CHI TIẾT THANH TOÁN");

      doc.moveDown(0.8);

      drawTableHeader(doc);
      drawInvoiceItems(doc, invoice);
      drawInvoiceSummary(doc, invoice);

      // Note
      if (invoice.note) {
        ensureSpace(doc, 60);

        doc.moveDown(1);

        doc
          .font("bold")
          .fontSize(9)
          .fillColor("#334155")
          .text("Ghi chú:");

        doc
          .font("regular")
          .fontSize(9)
          .fillColor("#64748B")
          .text(invoice.note, {
            width: 490,
          });
      }

      // Footer
      ensureSpace(doc, 65);

      doc.moveDown(2);

      drawDivider(doc);

    //   doc
    //     .font("regular")
    //     .fontSize(8)
    //     .fillColor("#64748B")
    //     .text(
    //       "Vui lòng kiểm tra thông tin hóa đơn và thanh toán đúng hạn.",
    //       {
    //         align: "center",
    //       }
    //     );

      doc.moveDown(0.5);

    //   doc
    //     .font("regular")
    //     .fontSize(8)
    //     .fillColor("#94A3B8")
    //     .text(
    //       "Hóa đơn được tạo tự động từ hệ thống quản lý phòng trọ.",
    //       {
    //         align: "center",
    //       }
    //     );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

export const invoicePdfService = {
  async exportPdf(id: bigint) {
    const invoice = await invoicePdfRepository.findById(id);

    if (!invoice) {
      throw new Error("INVOICE_NOT_FOUND");
    }

    if (invoice.status === "CANCELLED") {
      throw new Error("INVOICE_CANCELLED");
    }

    const pdfBuffer = await buildInvoicePdf(invoice);

    return {
      fileName: `hoa-don-${invoice.invoice_number}.pdf`,
      buffer: pdfBuffer,
    };
  },
};