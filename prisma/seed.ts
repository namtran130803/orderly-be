import { PrismaClient, StatusType } from '@prisma/client';
import bcrypt from 'bcrypt';
import { DEFAULT_STATUSES } from '../src/lib/constants';

const prisma = new PrismaClient();

async function main() {
  console.log('Bắt đầu seed dữ liệu mẫu...');

  // Xóa dữ liệu cũ nếu cần (tùy chọn, ở đây ta dùng upsert để an toàn khi chạy nhiều lần)
  const passwordHash = await bcrypt.hash('password123', 12);

  // 1. Tạo hoặc Tìm User
  const user = await prisma.user.upsert({
    where: { phone: '0901234567' },
    update: {},
    create: {
      name: 'Trần Trọng Nam',
      phone: '0901234567',
      passwordHash,
    },
  });
  console.log(`👤 User: ${user.name}`);

  // 2. Tạo hoặc Tìm Store
  let store = await prisma.store.findFirst({
    where: { userId: user.id },
  });
  if (!store) {
    store = await prisma.store.create({
      data: {
        userId: user.id,
        name: 'Orderly Coffee & Tea',
        address: '123 Đường Nguyễn Văn Linh, Quận 7, TP.HCM',
      },
    });
  }
  console.log(`🏪 Cửa hàng chính: ${store.name}`);

  // Xóa toàn bộ dữ liệu cũ của tất cả các cửa hàng để nạp mới hoàn toàn tránh trùng lặp
  console.log('🧹 Đang dọn dẹp dữ liệu cũ (Categories, Areas, Tables, MenuItems, Invoices, Orders, Statuses)...');
  await prisma.order.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.table.deleteMany();
  await prisma.area.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.category.deleteMany();
  await prisma.status.deleteMany();

  // Lặp qua tất cả các cửa hàng hiện có trong hệ thống để nạp danh mục, khu vực, món ăn, và phiếu nhập đồng nhất
  const allStores = await prisma.store.findMany();
  for (const s of allStores) {
    console.log(`\n▶ Bắt đầu nạp dữ liệu cho cửa hàng: ${s.name}`);

    // 3. Tạo Statuses chuẩn
    await prisma.status.createMany({
      data: [
        { storeId: s.id, name: DEFAULT_STATUSES.START, type: StatusType.start, sortOrder: 1 },
        { storeId: s.id, name: DEFAULT_STATUSES.END, type: StatusType.end, sortOrder: 20 },
      ],
    });

    // 4. Tạo Categories
    const catCoffee = await prisma.category.create({ data: { storeId: s.id, name: 'Cà phê truyền thống', sortOrder: 1 } });
    const catMachine = await prisma.category.create({ data: { storeId: s.id, name: 'Cà phê pha máy', sortOrder: 2 } });
    const catTea = await prisma.category.create({ data: { storeId: s.id, name: 'Trà Trái cây & Trà Sữa', sortOrder: 3 } });
    const catIceBlended = await prisma.category.create({ data: { storeId: s.id, name: 'Đá xay (Ice Blended)', sortOrder: 4 } });
    const catCake = await prisma.category.create({ data: { storeId: s.id, name: 'Bánh ngọt & Đồ ăn nhẹ', sortOrder: 5 } });

    // 5. Tạo Menu Items
    await prisma.menuItem.createMany({
      data: [
        // Cà phê truyền thống
        { categoryId: catCoffee.id, name: 'Cà phê Đen Đá', price: 29000 },
        { categoryId: catCoffee.id, name: 'Cà phê Sữa Đá', price: 35000 },
        { categoryId: catCoffee.id, name: 'Bạc Xỉu', price: 39000 },
        { categoryId: catCoffee.id, name: 'Cà phê Muối', price: 45000 },
        { categoryId: catCoffee.id, name: 'Cà phê Trứng', price: 55000 },
        // Cà phê pha máy
        { categoryId: catMachine.id, name: 'Espresso', price: 35000 },
        { categoryId: catMachine.id, name: 'Americano', price: 40000 },
        { categoryId: catMachine.id, name: 'Cappuccino', price: 50000 },
        { categoryId: catMachine.id, name: 'Latte', price: 50000 },
        { categoryId: catMachine.id, name: 'Caramel Macchiato', price: 55000 },
        // Trà Trái cây & Trà Sữa
        { categoryId: catTea.id, name: 'Trà Đào Cam Sả', price: 45000 },
        { categoryId: catTea.id, name: 'Trà Vải Nhiệt Đới', price: 45000 },
        { categoryId: catTea.id, name: 'Trà Olong Sen Vàng', price: 50000 },
        { categoryId: catTea.id, name: 'Trà Sữa Trân Châu Đường Đen', price: 45000 },
        { categoryId: catTea.id, name: 'Trà Sữa Nướng', price: 49000 },
        // Đá xay
        { categoryId: catIceBlended.id, name: 'Matcha Đá Xay', price: 55000 },
        { categoryId: catIceBlended.id, name: 'Cookies & Cream', price: 55000 },
        { categoryId: catIceBlended.id, name: 'Chocolate Đá Xay', price: 55000 },
        // Bánh ngọt
        { categoryId: catCake.id, name: 'Bánh Croissant bơ tỏi', price: 35000 },
        { categoryId: catCake.id, name: 'Tiramisu truyền thống', price: 45000 },
        { categoryId: catCake.id, name: 'Bánh Mousse Chanh Dây', price: 40000 },
        { categoryId: catCake.id, name: 'Bánh Cheesecake Dâu', price: 50000 },
        { categoryId: catCake.id, name: 'Hạt hướng dương', price: 15000 },
      ],
    });

    // 6. Tạo Areas & Tables
    const area1 = await prisma.area.create({ data: { storeId: s.id, name: 'Tầng 1', sortOrder: 1 } });
    const area2 = await prisma.area.create({ data: { storeId: s.id, name: 'Tầng 2', sortOrder: 2 } });
    const areaGarden = await prisma.area.create({ data: { storeId: s.id, name: 'Sân vườn', sortOrder: 3 } });
    const areaBar = await prisma.area.create({ data: { storeId: s.id, name: 'Quầy Bar', sortOrder: 4 } });

    await prisma.table.createMany({
      data: [
        // Tầng 1
        { areaId: area1.id, name: 'Bàn 101', sortOrder: 1 },
        { areaId: area1.id, name: 'Bàn 102', sortOrder: 2 },
        { areaId: area1.id, name: 'Bàn 103', sortOrder: 3 },
        { areaId: area1.id, name: 'Bàn 104', sortOrder: 4 },
        { areaId: area1.id, name: 'Bàn 105', sortOrder: 5 },
        { areaId: area1.id, name: 'Bàn 106', sortOrder: 6 },
        // Tầng 2
        { areaId: area2.id, name: 'Bàn 201', sortOrder: 1 },
        { areaId: area2.id, name: 'Bàn 202', sortOrder: 2 },
        { areaId: area2.id, name: 'Bàn 203', sortOrder: 3 },
        { areaId: area2.id, name: 'Bàn 204', sortOrder: 4 },
        { areaId: area2.id, name: 'Bàn 205', sortOrder: 5 },
        { areaId: area2.id, name: 'Bàn 206', sortOrder: 6 },
        { areaId: area2.id, name: 'Bàn 207', sortOrder: 7 },
        { areaId: area2.id, name: 'Bàn 208', sortOrder: 8 },
        // Sân vườn
        { areaId: areaGarden.id, name: 'Bàn SV1', sortOrder: 1 },
        { areaId: areaGarden.id, name: 'Bàn SV2', sortOrder: 2 },
        { areaId: areaGarden.id, name: 'Bàn SV3', sortOrder: 3 },
        { areaId: areaGarden.id, name: 'Bàn SV4', sortOrder: 4 },
        { areaId: areaGarden.id, name: 'Bàn SV5', sortOrder: 5 },
        // Quầy Bar
        { areaId: areaBar.id, name: 'Ghế Bar 1', sortOrder: 1 },
        { areaId: areaBar.id, name: 'Ghế Bar 2', sortOrder: 2 },
        { areaId: areaBar.id, name: 'Ghế Bar 3', sortOrder: 3 },
        { areaId: areaBar.id, name: 'Ghế Bar 4', sortOrder: 4 },
      ],
    });

    // 7. Tạo Invoices
    const sampleSuppliers = [
      'Nhập hạt cà phê Arabica Cầu Đất',
      'Nhập hạt cà phê Robusta Đắk Lắk',
      'Nhập sữa tươi tiệt trùng Vinamilk',
      'Nhập sữa đặc Ngôi Sao Phương Nam',
      'Nhập trà ô long hoa nhài',
      'Nhập đào ngâm đóng hộp',
      'Nhập vải thiều đóng hộp',
      'Nhập đường cát trắng',
      'Nhập ly nhựa và ống hút sinh học',
      'Nhập bột bánh ngọt và kem béo',
    ];

    const invoiceEntries = [];
    const baseDate = new Date();

    for (let dOffset = 0; dOffset < 10; dOffset++) {
      const targetDate = new Date();
      targetDate.setDate(baseDate.getDate() - dOffset);
      targetDate.setHours(0, 0, 0, 0);

      for (let i = 0; i < 3; i++) {
        const randomSupplier = sampleSuppliers[(dOffset * 3 + i) % sampleSuppliers.length];
        const randomAmount = (Math.floor(Math.random() * 15) + 5) * 100000;
        
        const createdAt = new Date(targetDate.getTime());
        createdAt.setHours(8 + i * 3, 0, 0, 0);

        invoiceEntries.push({
          storeId: s.id,
          description: randomSupplier,
          amount: randomAmount,
          rawDate: targetDate,
          createdAt,
        });
      }
    }

    await prisma.invoice.createMany({ data: invoiceEntries });
    console.log(`✔ Đã nạp danh mục, thực đơn phong phú, 4 khu vực bàn và ${invoiceEntries.length} phiếu nhập mẫu.`);
  }

  console.log('\n✅ Seed dữ liệu mẫu hoàn tất! Bạn có thể dùng SĐT: 0901234567 / Pass: password123 để đăng nhập.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
