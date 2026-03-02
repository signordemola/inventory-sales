import {
  Controller,
  Get,
  Post,
  Param,
  Res,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ReceiptService } from './receipt.service';
import { Response, Request } from 'express';
import { RolesGuard } from 'src/guards/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { UserRole } from 'generated/prisma/enums';

@Controller('sales')
@UseGuards(RolesGuard)
@Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.CASHIER)
export class ReceiptController {
  constructor(private readonly receiptService: ReceiptService) {}

  /**
   * GET /sales/:id/receipt
   * Streams a PDF receipt directly to the client.
   */
  @Get(':id/receipt')
  async getReceipt(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const businessId = req.user?.businessId!;
    const pdfBuffer = await this.receiptService.generatePdf(id, businessId);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="receipt-${id}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }

  /**
   * POST /sales/:id/receipt/store
   * Generates the PDF, uploads it to Cloudinary, stores the URL on the Sale,
   * and returns the URL to the client. Keep this idempodent (if URL exists, just return it).
   */
  @Post(':id/receipt/store')
  async storeReceipt(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<{ url: string }> {
    const businessId = req.user?.businessId!;
    const url = await this.receiptService.generateAndStorePdf(id, businessId);
    return { url };
  }
}
