import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import {
  PDFDocument,
  rgb,
  StandardFonts,
  degrees,
  PDFPage,
  PDFFont,
} from 'pdf-lib';
import { Readable } from 'stream';

@Injectable()
export class ReceiptService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async generatePdf(saleId: string, businessId: string): Promise<Buffer> {
    // Fetch sale with all relations
    const sale = await this.prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        items: {
          include: {
            product: { select: { name: true, sku: true } },
            variant: { select: { name: true } },
          },
        },
        payments: true,
        customer: { select: { name: true, phone: true } },
        cashier: { select: { name: true } },
        business: {
          select: {
            name: true,
            address: true,
            phone: true,
            email: true,
            taxRate: true,
            currency: true,
          },
        },
      },
    });

    if (!sale || sale.businessId !== businessId) {
      throw new NotFoundException('Sale not found');
    }

    const business = sale.business;
    const currency = business?.currency || 'NGN';
    const fmt = (n: number) => `${currency} ${Number(n).toFixed(2)}`;

    // ─── PDF Document ────────────────────────────────────────────
    const doc = await PDFDocument.create();
    const page = doc.addPage([340, 600]); // thermal receipt width ~3.14"
    const { height } = page.getSize();

    const regular = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);

    let y = height - 20;
    const left = 20;
    const right = 320;
    const mid = (right + left) / 2;

    const draw = (
      text: string,
      x: number,
      yPos: number,
      opts: {
        font?: PDFFont;
        size?: number;
        color?: [number, number, number];
        align?: 'left' | 'center' | 'right';
      } = {},
    ) => {
      const {
        font = regular,
        size = 8,
        color = [0, 0, 0],
        align = 'left',
      } = opts;
      const [r, g, b] = color;
      const textWidth = font.widthOfTextAtSize(text, size);
      let xPos = x;
      if (align === 'center') xPos = mid - textWidth / 2;
      if (align === 'right') xPos = right - textWidth;
      page.drawText(text, {
        x: xPos,
        y: yPos,
        font,
        size,
        color: rgb(r, g, b),
      });
    };

    const line = (yPos: number, dash = false) => {
      page.drawLine({
        start: { x: left, y: yPos },
        end: { x: right, y: yPos },
        thickness: 0.5,
        color: rgb(0.7, 0.7, 0.7),
        dashArray: dash ? [3, 3] : undefined,
      });
    };

    // ─── Header ──────────────────────────────────────────────────
    draw(business?.name || 'Business', left, y, {
      font: bold,
      size: 13,
      align: 'center',
    });
    y -= 14;
    if (business?.address) {
      draw(business.address, left, y, {
        size: 7,
        align: 'center',
        color: [0.4, 0.4, 0.4],
      });
      y -= 10;
    }
    if (business?.phone) {
      draw(`Tel: ${business.phone}`, left, y, {
        size: 7,
        align: 'center',
        color: [0.4, 0.4, 0.4],
      });
      y -= 10;
    }
    y -= 4;
    line(y);
    y -= 10;

    // ─── Sale Info ───────────────────────────────────────────────
    draw('SALES RECEIPT', left, y, { font: bold, size: 9, align: 'center' });
    y -= 12;
    const dateStr = new Date(sale.createdAt).toLocaleString('en-NG', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    draw(`Ref: ${sale.reference}`, left, y, { size: 7 });
    draw(dateStr, left, y, { size: 7, align: 'right', color: [0.4, 0.4, 0.4] });
    y -= 10;
    draw(`Cashier: ${sale.cashier?.name || '—'}`, left, y, { size: 7 });
    if (sale.customer) {
      draw(`Customer: ${sale.customer.name}`, left, y, {
        size: 7,
        align: 'right',
      });
    }
    y -= 6;
    line(y, true);
    y -= 10;

    // ─── Column Headers ──────────────────────────────────────────
    draw('ITEM', left, y, { font: bold, size: 7 });
    draw('QTY', left + 140, y, { font: bold, size: 7, align: 'right' });
    draw('PRICE', left + 190, y, { font: bold, size: 7, align: 'right' });
    draw('TOTAL', right, y, { font: bold, size: 7, align: 'right' });
    y -= 4;
    line(y);
    y -= 10;

    // ─── Items ───────────────────────────────────────────────────
    for (const item of sale.items) {
      const name = item.variant
        ? `${item.product.name} (${item.variant.name})`
        : item.product.name;
      // Truncate long names
      const maxLen = 24;
      const displayName =
        name.length > maxLen ? name.slice(0, maxLen - 1) + '…' : name;
      draw(displayName, left, y, { size: 7 });
      draw(String(item.quantity), left + 140, y, { size: 7, align: 'right' });
      draw(fmt(Number(item.unitPrice)), left + 190, y, {
        size: 7,
        align: 'right',
      });
      draw(fmt(Number(item.total)), right, y, { size: 7, align: 'right' });
      y -= 11;
    }

    y -= 2;
    line(y, true);
    y -= 10;

    // ─── Totals ──────────────────────────────────────────────────
    draw('Subtotal', left, y, { size: 7 });
    draw(fmt(Number(sale.subtotal)), right, y, { size: 7, align: 'right' });
    y -= 11;

    if (Number(sale.discount) > 0) {
      draw('Discount', left, y, { size: 7 });
      draw(`- ${fmt(Number(sale.discount))}`, right, y, {
        size: 7,
        align: 'right',
        color: [0.8, 0.2, 0.2],
      });
      y -= 11;
    }

    line(y);
    y -= 10;

    draw('TOTAL', left, y, { font: bold, size: 9 });
    draw(fmt(Number(sale.total)), right, y, {
      font: bold,
      size: 9,
      align: 'right',
    });
    y -= 14;

    // ─── Payments ────────────────────────────────────────────────
    for (const p of sale.payments) {
      draw(`Payment (${p.method})`, left, y, {
        size: 7,
        color: [0.4, 0.4, 0.4],
      });
      draw(fmt(Number(p.amount)), right, y, {
        size: 7,
        align: 'right',
        color: [0.4, 0.4, 0.4],
      });
      y -= 10;
    }

    y -= 4;
    line(y);
    y -= 14;

    // ─── Footer ──────────────────────────────────────────────────
    draw('Thank you for your business!', left, y, {
      size: 7,
      align: 'center',
      color: [0.4, 0.4, 0.4],
    });
    y -= 10;
    draw('Goods sold are not returnable without receipt.', left, y, {
      size: 6,
      align: 'center',
      color: [0.6, 0.6, 0.6],
    });

    const pdfBytes = await doc.save();
    return Buffer.from(pdfBytes);
  }

  async generateAndStorePdf(
    saleId: string,
    businessId: string,
  ): Promise<string> {
    const sale = await this.prisma.sale.findUnique({
      where: { id: saleId },
    });

    if (!sale || sale.businessId !== businessId) {
      throw new NotFoundException('Sale not found');
    }

    if (sale.receiptUrl) {
      return sale.receiptUrl; // Already generated and stored
    }

    const pdfBuffer = await this.generatePdf(saleId, businessId);

    // We must mock an Express.Multer.File object for our cloudinaryService
    const mockFile = {
      buffer: pdfBuffer,
      mimetype: 'application/pdf',
      originalname: `receipt-${saleId}.pdf`,
    } as Express.Multer.File;

    const folder = `inventory/${businessId}/receipts`;
    const result = await this.cloudinaryService.uploadFile(mockFile, folder);
    const receiptUrl = (result as any).secure_url;

    await this.prisma.sale.update({
      where: { id: saleId },
      data: { receiptUrl },
    });

    return receiptUrl;
  }
}
