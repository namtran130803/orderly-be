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

function splitName(name: string): string[] {
  return name
    .split(/[/,]/)
    .map(s => s.trim())
    .filter(Boolean);
}

function postProcessCategories(categories: AICategory[]): AICategory[] {
  const result: AICategory[] = [];

  for (const cat of categories) {
    const catParts = splitName(cat.name);

    if (catParts.length > 1) {
      // Split category into parts, each gets all items with prefixed names
      for (let i = 0; i < catParts.length; i++) {
        const prefix = catParts[i];
        const items = cat.items.map(item => {
          const itemParts = splitName(item.name);
          if (itemParts.length > 1) {
            return itemParts.map(p => ({
              name: `${prefix} ${p}`.trim(),
              price: item.price,
            }));
          }
          return [{
            name: item.name.startsWith(prefix) ? item.name : `${prefix} ${item.name}`.trim(),
            price: item.price,
          }];
        }).flat();

        result.push({
          name: prefix,
          sortOrder: cat.sortOrder + i,
          items,
        });
      }
    } else {
      // Single category — just split item names
      const items = cat.items.map(item => {
        const itemParts = splitName(item.name);
        if (itemParts.length > 1) {
          // Prefix item parts with category name if not already
          const catName = cat.name.replace(/^(Các món|Món)\s+/i, '');
          return itemParts.map(p => ({
            name: p.includes(catName) ? p : `${catName} ${p}`.trim(),
            price: item.price,
          }));
        }
        return [item];
      }).flat();

      result.push({ ...cat, items });
    }
  }

  return result;
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

  const processed = postProcessCategories(parsed.categories);

  if (processed.length > 15) {
    throw ApiError.badRequest('Quá nhiều danh mục (tối đa 15).');
  }

  const totalItems = processed.reduce((sum, cat) => sum + cat.items.length, 0);

  if (totalItems === 0) {
    throw ApiError.badRequest('Không tìm thấy món ăn nào trong mô tả.');
  }

  if (totalItems > 80) {
    throw ApiError.badRequest('Quá nhiều món ăn (tối đa 80).');
  }

  return processed;
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
