import { Injectable, Logger } from '@nestjs/common';

export interface JtTraceResult {
  warehouseReceivedAt: Date | null;
  matchedEventCode: number | null;
  matchedEventName: string | null;
  matchedDesc: string | null;
  lastEventAt: Date | null;
  traceDetails: any[];
}

@Injectable()
export class JtExpressMapper {
  private readonly logger = new Logger(JtExpressMapper.name);

  /**
   * Phân tích response từ J&T API và tìm mốc "Ngày về kho" phù hợp
   */
  mapTraceResponse(responseData: any): JtTraceResult {
    const result: JtTraceResult = {
      warehouseReceivedAt: null,
      matchedEventCode: null,
      matchedEventName: null,
      matchedDesc: null,
      lastEventAt: null,
      traceDetails: [],
    };

    if (!responseData || !responseData.data || !Array.isArray(responseData.data)) {
      return result;
    }

    // J&T trả về mảng theo từng billCode
    const firstBill = responseData.data[0];
    if (!firstBill || !Array.isArray(firstBill.details)) {
      return result;
    }

    const details = firstBill.details;
    result.traceDetails = details;

    if (details.length > 0) {
      // Helper parse thời gian J&T (VD: 2026-07-11 14:30:00) thành chuẩn ISO theo múi giờ +07:00
      const parseDate = (str: string): Date | null => {
        if (!str) return null;
        const iso = str.replace(' ', 'T') + '+07:00';
        const d = new Date(iso);
        return isNaN(d.getTime()) ? null : d;
      };

      const validDetails = details.filter((e: any) => parseDate(e.scanTime) !== null);

      // Sắp xếp các sự kiện theo thời gian tăng dần (cũ nhất -> mới nhất)
      const sorted = [...validDetails].sort((a: any, b: any) => {
        return parseDate(a.scanTime)!.getTime() - parseDate(b.scanTime)!.getTime();
      });

      const lastEvent = sorted[sorted.length - 1];
      if (lastEvent && lastEvent.scanTime) {
        result.lastEventAt = parseDate(lastEvent.scanTime);
      }

      // Tìm mốc "Về kho" bằng cách duyệt từ MỚI NHẤT về CŨ NHẤT
      // Ưu tiên các mã: 117 (Returned Sign), 116 (Returning), 120 (Return Problem), 110 (Arrival - phải kèm mô tả return/hoàn)
      
      const strongCodes = [117, 116, 120];

      for (let i = sorted.length - 1; i >= 0; i--) {
        const event = sorted[i];
        const code = Number(event.scanTypeCode);
        const desc = (event.desc || '').toLowerCase();

        // 1. Nếu là các mã mạnh (hoàn trả)
        if (strongCodes.includes(code)) {
          result.warehouseReceivedAt = parseDate(event.scanTime);
          result.matchedEventCode = code;
          result.matchedEventName = event.scanTypeName;
          result.matchedDesc = event.desc;
          break;
        }

        // 2. Fallback tìm theo keyword trong desc (trường hợp code lạ hoặc 110/Arrival)
        if (
          desc.includes('đã nhận hàng hoàn') ||
          desc.includes('giao bưu cục gốc') ||
          desc.includes('returned') ||
          desc.includes('returning')
        ) {
          result.warehouseReceivedAt = parseDate(event.scanTime);
          result.matchedEventCode = code;
          result.matchedEventName = event.scanTypeName;
          result.matchedDesc = event.desc;
          break;
        }
      }
    }

    return result;
  }
}
