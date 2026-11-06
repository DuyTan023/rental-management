// services/landlord/invoice.service.ts

import { Prisma } from "@/generated/prisma/client";
import { invoiceRepository } from "@/lib/api/repositories/invoices/invoice.repository";
import { randomUUID } from "node:crypto";
export const invoiceService = {
  // Tạo khoảng thời gian của kỳ hóa đơn
  getBillingPeriod(billingMonth: number, billingYear: number) {
    const periodStart = new Date(Date.UTC(billingYear, billingMonth - 1, 1));

    const periodEnd = new Date(Date.UTC(billingYear, billingMonth, 0));

    return {
      periodStart,
      periodEnd,
    };
  },

  // Kiểm tra giá tiền hợp lệ
  validatePrice(price: Prisma.Decimal, description: string) {
    if (!price.isFinite() || price.lessThanOrEqualTo(0)) {
      throw new Error(`${description} không có đơn giá hợp lệ`);
    }
  },

  // Tính toán các khoản thu của một hợp đồng
  async calculateInvoice(
    contractId: bigint,
    billingMonth: number,
    billingYear: number,
  ) {
    const { periodStart, periodEnd } = this.getBillingPeriod(
      billingMonth,
      billingYear,
    );

    // Lấy dữ liệu hợp đồng
    const contract = await invoiceRepository.findContractForInvoice(
      contractId,
      billingMonth,
      billingYear,
      periodStart,
      periodEnd,
    );

    if (!contract) {
      throw new Error("Không tìm thấy hợp đồng");
    }

    // Kiểm tra hợp đồng có hiệu lực trong kỳ
    const contractStart = contract.start_date;
    const contractEnd = contract.termination_date ?? contract.end_date;

    if (
      contractStart > periodEnd ||
      (contractEnd !== null && contractEnd < periodStart)
    ) {
      throw new Error("Hợp đồng không có hiệu lực trong kỳ hóa đơn");
    }

    const items = [];

    // ==========================================
    // 1. TÍNH TIỀN PHÒNG
    // ==========================================

    const priceAdjustment = contract.contract_price_adjustments[0];

    const rentPrice = new Prisma.Decimal(
      priceAdjustment?.new_rent_price ?? contract.rent_price,
    );

    this.validatePrice(rentPrice, "Tiền phòng");

    items.push({
      description: "Tiền phòng",
      quantity: new Prisma.Decimal(1),
      unit_price: rentPrice,
      subtotal: rentPrice,
    });

    // ==========================================
    // 2. TÍNH CÁC DỊCH VỤ CỦA PHÒNG
    // ==========================================

    for (const roomService of contract.rooms.room_services) {
      const service = roomService.services;

      // Kiểm tra đơn giá dịch vụ
      const unitPrice = new Prisma.Decimal(service.default_unit_price);

      this.validatePrice(unitPrice, `Dịch vụ ${service.name}`);

      // ------------------------------------------
      // 2.1. Dịch vụ cố định theo tháng
      // ------------------------------------------

      if (service.type === "FIXED_PER_MONTH") {
        items.push({
          service_id: service.id,
          description: service.name,
          quantity: new Prisma.Decimal(1),
          unit_price: unitPrice,
          subtotal: unitPrice,
        });
      }

      // ------------------------------------------
      // 2.2. Dịch vụ cố định theo đầu người
      // ------------------------------------------
      else if (service.type === "FIXED_PER_HEAD") {
        const tenantIds = new Set(
          contract.contract_tenants
            .filter(
              (tenant) =>
                tenant.joined_at <= periodEnd &&
                (tenant.left_at === null || tenant.left_at >= periodStart),
            )
            .map((tenant) => tenant.profile_id.toString()),
        );

        const quantity = new Prisma.Decimal(tenantIds.size);

        // Không tạo dòng chi tiết nếu không có người thuê phát sinh
        if (quantity.equals(0)) {
          continue;
        }

        items.push({
          service_id: service.id,
          description: service.name,
          quantity,
          unit_price: unitPrice,
          subtotal: unitPrice.mul(quantity),
        });
      }

      // ------------------------------------------
      // 2.3. Dịch vụ tính theo chỉ số
      // ------------------------------------------
      else if (service.type === "METERED") {
        const readings = contract.meter_readings.filter(
          (reading) => reading.service_id === service.id,
        );

        if (readings.length === 0) {
          throw new Error(
            `Thiếu chỉ số ${service.name} APPROVED trong kỳ hóa đơn`,
          );
        }

        if (readings.length > 1) {
          throw new Error(
            `Có nhiều bản ghi chỉ số ${service.name} trong kỳ hóa đơn`,
          );
        }

        const reading = readings[0];

        // Kiểm tra chỉ số đúng phòng và hợp đồng
        if (
          reading.room_id !== contract.room_id ||
          reading.contract_id !== contract.id ||
          reading.status !== "APPROVED" ||
          reading.period_month !== billingMonth ||
          reading.period_year !== billingYear
        ) {
          throw new Error(
            `Chỉ số ${service.name} không hợp lệ trong kỳ hóa đơn`,
          );
        }

        if (reading.consumption === null) {
          throw new Error(`Chỉ số tiêu thụ ${service.name} không hợp lệ`);
        }

        const quantity = new Prisma.Decimal(reading.consumption);

        if (quantity.lessThan(0)) {
          throw new Error(`Chỉ số tiêu thụ ${service.name} không hợp lệ`);
        }

        items.push({
          service_id: service.id,
          meter_reading_id: reading.id,
          description: service.name,
          quantity,
          unit_price: unitPrice,
          subtotal: quantity.mul(unitPrice),
        });
      }
    }

    // ==========================================
    // 3. TÍNH TỔNG TIỀN HÓA ĐƠN
    // ==========================================

    const totalAmount = items.reduce(
      (total, item) => total.add(item.subtotal),
      new Prisma.Decimal(0),
    );

    return {
      contract,
      items,
      totalAmount,
      billingMonth,
      billingYear,
      periodStart,
      periodEnd,
    };
  },

  // ==========================================
  // 4. XEM TRƯỚC HÓA ĐƠN
  // ==========================================

  async previewInvoice(
    contractId: bigint,
    billingMonth: number,
    billingYear: number,
  ) {
    // Kiểm tra hóa đơn đã tồn tại chưa
    const existingInvoice = await invoiceRepository.findByContractPeriod(
      contractId,
      billingMonth,
      billingYear,
    );

    if (existingInvoice) {
      throw new Error("Hóa đơn của hợp đồng trong kỳ này đã tồn tại");
    }

    // Tính toán hóa đơn, không lưu database
    return this.calculateInvoice(contractId, billingMonth, billingYear);
  },

  // ==========================================
  // 5. LẬP HÓA ĐƠN CHO MỘT HỢP ĐỒNG
  // ==========================================

  async generateInvoice(
    contractId: bigint,
    billingMonth: number,
    billingYear: number,
    dueDate: Date,
  ) {
    try {
      // Kiểm tra hóa đơn trùng
      const existingInvoice = await invoiceRepository.findByContractPeriod(
        contractId,
        billingMonth,
        billingYear,
      );

      if (existingInvoice) {
        throw new Error("Hóa đơn của hợp đồng trong kỳ này đã tồn tại");
      }

      // Tính toán các khoản thu
      const result = await this.calculateInvoice(
        contractId,
        billingMonth,
        billingYear,
      );

      // Tạo mã hóa đơn
      const invoiceNumber =
        `INV-${billingYear}${String(billingMonth).padStart(2, "0")}-${contractId}-${randomUUID().slice(0, 8).toUpperCase()}`;

      // Tạo hóa đơn và các chi tiết
      const invoice = await invoiceRepository.createWithItems({
        invoice_number: invoiceNumber,
        billing_month: billingMonth,
        billing_year: billingYear,
        issue_date: new Date(),
        due_date: dueDate,
        total_amount: result.totalAmount,
        paid_amount: new Prisma.Decimal(0),
        status: "UNPAID",

        rental_contracts: {
          connect: {
            id: contractId,
          },
        },

        invoice_items: {
          create: result.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            subtotal: item.subtotal,

            ...(item.service_id && {
              services: {
                connect: {
                  id: item.service_id,
                },
              },
            }),

            ...(item.meter_reading_id && {
              meter_readings: {
                connect: {
                  id: item.meter_reading_id,
                },
              },
            }),
          })),
        },
      });

      return invoice;
    } catch (error) {
      // Xử lý trường hợp nhiều request lập cùng một hóa đơn
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new Error("Hóa đơn của hợp đồng trong kỳ này đã tồn tại");
      }

      throw error;
    }
  },

  // Tạo nhiều hợp đồng cùng lúc

  async generateInvoices(
    contractIds: bigint[],
    billingMonth: number,
    billingYear: number,
    dueDate: Date,
  ) {
    const results = [];

    for (const contractId of contractIds) {
      try {
        const invoice = await this.generateInvoice(
          contractId,
          billingMonth,
          billingYear,
          dueDate,
        );

        results.push({
          contract_id: contractId.toString(),
          status: "SUCCESS",
          invoice_id: invoice.id.toString(),
        });
      } catch (error) {
        results.push({
          contract_id: contractId.toString(),
          status: "FAILED",
          message:
            error instanceof Error ? error.message : "Không thể lập hóa đơn",
        });
      }
    }

    const successCount = results.filter(
      (item) => item.status === "SUCCESS",
    ).length;

    return {
      total: results.length,
      success_count: successCount,
      failed_count: results.length - successCount,
      results,
    };
  },



  async getInvoices(params: {
    page?: number;
    limit?: number;
    month?: number;
    year?: number;
    keyword?: string;
    status?: string;
  }) {
    const {
      page = 1,
      limit = 10,
      month,
      year,
      keyword,
      status,
    } = params;

    // Xây dựng điều kiện tìm kiếm
    const where: Prisma.invoicesWhereInput = {};

    // Lọc theo tháng
    if (month !== undefined) {
      where.billing_month = month;
    }

    // Lọc theo năm
    if (year !== undefined) {
      where.billing_year = year;
    }

    // Lọc theo trạng thái
    if (status) {
      where.status = status as Prisma.Enuminvoice_statusFilter["equals"];
    }

    // Tìm kiếm theo mã hóa đơn, phòng,
    // hợp đồng và tên người thuê
    if (keyword?.trim()) {
      const search = keyword.trim();

      where.OR = [
        {
          invoice_number: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          rental_contracts: {
            contract_number: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          rental_contracts: {
            rooms: {
              room_number: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
        },
        {
          rental_contracts: {
            contract_tenants: {
              some: {
                profiles: {
                  full_name: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              },
            },
          },
        },
      ];
    }

    // Lấy danh sách và tổng số hóa đơn
    const [items, total] = await invoiceRepository.findMany(
      where,
      page,
      limit
    );

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getInvoiceById(id: bigint) {
    const invoice = await invoiceRepository.findById(id);

    if (!invoice) {
      throw new Error("Không tìm thấy hóa đơn");
    }

    // Tính số tiền còn phải thanh toán
    // Không thay đổi dữ liệu trong database
    const remainingAmount = new Prisma.Decimal(
      invoice.total_amount
    ).minus(invoice.paid_amount);

    return {
      ...invoice,
      remaining_amount: remainingAmount,
    };
  },

};
