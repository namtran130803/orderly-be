import { prisma } from '@/config/prisma';
import { ApiError } from '@/lib/response';
import * as categoryService from '@/modules/categories/categories.service';
import * as menuItemService from '@/modules/menu-items/menu-items.service';
import { callGroqForAnalysis, callGroqForGeneration } from '@/lib/ai';
import type { AnalyzeMenuDto, GenerateMenuDto } from '@/modules/ai/menu/schema';

interface AICategory {
  name: string;
  sortOrder: number;
  items: { name: string; price: number }[];
}

function parseAIMenuJson(raw: string): AICategory[] {
  let parsed: { categories?: AICategory[] };

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw ApiError.badRequest('AI không thể phân tích menu. Vui lòng thử lại với mô tả khác.');
  }

  if (!parsed.categories || !Array.isArray(parsed.categories)) {
    throw ApiError.badRequest('AI không thể phân tích menu. Vui lòng thử lại với mô tả khác.');
  }

  if (parsed.categories.length > 15) {
    throw ApiError.badRequest('Quá nhiều danh mục (tối đa 15).');
  }

  const totalItems = parsed.categories.reduce((sum, cat) => sum + cat.items.length, 0);

  if (totalItems === 0) {
    throw ApiError.badRequest('Không tìm thấy món ăn nào trong mô tả.');
  }

  if (totalItems > 80) {
    throw ApiError.badRequest('Quá nhiều món ăn (tối đa 80).');
  }

  return parsed.categories;
}

export async function analyzeMenuImage(storeId: number, dto: AnalyzeMenuDto): Promise<string> {
  return callGroqForAnalysis(dto.image);
}

export async function generateMenu(
  storeId: number,
  dto: GenerateMenuDto,
): Promise<{ categories: unknown[]; menuItems: unknown[] }> {
  const raw = await callGroqForGeneration(dto.description);
  const categories = parseAIMenuJson(raw);

  if (dto.mode === 'replace') {
    await prisma.menuItem.deleteMany({ where: { category: { storeId } } });
    await prisma.category.deleteMany({ where: { storeId } });
  }

  const createdCategories: unknown[] = [];
  const createdItems: unknown[] = [];

  for (const cat of categories) {
    const category = await categoryService.createCategory(storeId, {
      name: cat.name,
      sortOrder: cat.sortOrder,
    });
    createdCategories.push(category);

    for (const item of cat.items) {
      const menuItem = await menuItemService.createMenuItem(storeId, {
        categoryId: category.id,
        name: item.name,
        price: item.price,
      });
      createdItems.push(menuItem);
    }
  }

  return { categories: createdCategories, menuItems: createdItems };
}
