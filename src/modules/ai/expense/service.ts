import { prisma } from '@/config/prisma';
import { ApiError } from '@/lib/response';
import * as expenseCrudService from '@/modules/expenses/expenses.service';
import { callGroqForExpenseAnalysis, callGroqForExpenseGeneration } from '@/lib/ai';
import type { AnalyzeExpenseDto, GenerateExpenseDto } from '@/modules/ai/expense/schema';

interface AIExpense {
  title: string;
  amount: number;
  rawDate?: string;
}

function parseAIExpenseJson(raw: string): AIExpense[] {
  let parsed: AIExpense[];

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw ApiError.badRequest('AI không thể phân tích chi tiêu. Vui lòng thử lại với mô tả khác.');
  }

  if (!Array.isArray(parsed)) {
    throw ApiError.badRequest('AI không thể phân tích chi tiêu. Vui lòng thử lại với mô tả khác.');
  }

  if (parsed.length === 0) {
    throw ApiError.badRequest('Không tìm thấy khoản chi tiêu nào trong mô tả.');
  }

  if (parsed.length > 50) {
    throw ApiError.badRequest('Quá nhiều khoản chi tiêu (tối đa 50).');
  }

  return parsed;
}

export async function analyzeExpenseImage(storeId: number, dto: AnalyzeExpenseDto): Promise<string> {
  return callGroqForExpenseAnalysis(dto.image);
}

export async function generateExpenses(
  storeId: number,
  dto: GenerateExpenseDto,
): Promise<{ expenses: unknown[] }> {
  const raw = await callGroqForExpenseGeneration(dto.description);
  const items = parseAIExpenseJson(raw);

  const createdExpenses: unknown[] = [];

  for (const item of items) {
    const expense = await expenseCrudService.createExpense(storeId, {
      title: item.title,
      amount: item.amount,
      rawDate: item.rawDate,
    });
    createdExpenses.push(expense);
  }

  return { expenses: createdExpenses };
}
