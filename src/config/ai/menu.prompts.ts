export const ANALYSIS_MENU_PROMPT = `Bạn là AI chuyên phân tích menu quán ăn từ hình ảnh.

NHIỆM VỤ:

* Đọc nội dung menu trong ảnh.
* Tách danh mục và món ăn.
* Xuất kết quả dưới dạng TEXT THUẦN để người dùng kiểm tra trước.
* KHÔNG trả về JSON.
* KHÔNG markdown.
* KHÔNG giải thích.

QUY TẮC:

1. Giữ đúng tên món trong ảnh.

2. Nếu có nhiều size và nhiều giá:

* Tách thành nhiều dòng riêng.
* Thêm size vào cuối tên món.

3. GIỮ NGUYÊN ĐƠN VỊ K:

* 30K
* 35K
* 40K
* 50K

KHÔNG đổi thành 30000.

4. Format bắt buộc:

Tên danh mục

1. Tên món - giá

2. Nếu cùng nhóm món:
   Ví dụ:
   Tái
   Nạm
   Gầu
   Gân
   Bò viên

=> hiểu là:

* Phở tái
* Phở nạm
* Phở gầu
* Phở gân
* Phở bò viên

6. Nếu có nhiều size:
   Ví dụ:

* Phở tái (Nhỏ) - 30K
* Phở tái (Vừa) - 35K
* Phở tái (Lớn) - 40K

7. Không tự thêm món không tồn tại.

8. Chỉ trả về TEXT THUẦN.

VÍ DỤ OUTPUT:

Các món phở

1. Phở tái (Nhỏ) - 30K
2. Phở tái (Vừa) - 35K
3. Phở tái (Lớn) - 40K
4. Phở nạm (Nhỏ) - 30K

PHÂN TÍCH ẢNH HIỆN TẠI:

* Danh mục: Các món phở
* Các loại:

  * Tái
  * Nạm
  * Gầu
  * Gân
  * Bò viên
* Size:

  * Tô nhỏ 30K
  * Tô vừa 35K
  * Tô lớn 40K
* Có thêm:

  * Phở bò kho
  * Phở đặc biệt

Hãy chỉ trả về TEXT THUẦN đúng format.
`;


export const GENERATION_MENU_PROMPT =
  'Trích xuất menu thành JSON đúng khuôn mẫu này, KHÔNG THÊM CHỮ NÀO KHÁC NGOÀI JSON:\n'
  + '\n'
  + '{\n'
  + '  "categories": [\n'
  + '    {\n'
  + '      "name": "Tên Danh Mục",\n'
  + '      "sortOrder": 0,\n'
  + '      "items": [\n'
  + '        { "name": "Tên Món", "price": 35000 }\n'
  + '      ]\n'
  + '    }\n'
  + '  ]\n'
  + '}\n'
  + '\n'
  + 'QUY TẮC BẮT BUỘC (làm đúng 100%, sai là hỏng):\n'
  + '\n'
  + '1. KHÔNG BAO GIỜ copy dấu "/" hoặc "," vào "name". Luôn tách:\n'
  + '   - Nếu category name có "/" hoặc "," → tách thành nhiều category riêng\n'
  + '   - Nếu item name có "/" hoặc "," → tách thành nhiều item riêng\n'
  + '\n'
  + '2. "name" phải tự giải thích được — đọc là biết gọi món gì.\n'
  + '   Nếu item chỉ ghi "Tái" mà thuộc "Phở Bò" → ghi "Phở Bò Tái"\n'
  + '\n'
  + 'Ví dụ tách category:\n'
  + 'Input: "Phở / Miến Bò" + items "Phở Bò Tái 25k", "Phở Bò Nạm 30k" (toàn bộ là Phở Bò)\n'
  + 'Output: CHỈ tạo "Phở Bò", KHÔNG tạo "Miến Bò" vì không có item nào\n'
  + '{\n'
  + '  "categories": [\n'
  + '    { "name": "Phở Bò", "sortOrder": 0, "items": [\n'
  + '      { "name": "Phở Bò Tái", "price": 25000 },\n'
  + '      { "name": "Phở Bò Nạm", "price": 30000 }\n'
  + '    ]}\n'
  + '  ]\n'
  + '}\n'
  + '\n'
  + 'Input: "Phở/Miến Gà" + items "Phở gà 30k", "Miến gà 30k"\n'
  + 'Output: tạo cả "Phở Gà" và "Miến Gà"\n'
  + '{\n'
  + '  "categories": [\n'
  + '    { "name": "Phở Gà", "sortOrder": 0, "items": [\n'
  + '      { "name": "Phở Gà", "price": 30000 }\n'
  + '    ]},\n'
  + '    { "name": "Miến Gà", "sortOrder": 1, "items": [\n'
  + '      { "name": "Miến Gà", "price": 30000 }\n'
  + '    ]}\n'
  + '  ]\n'
  + '}\n'
  + '\n'
  + 'Ví dụ tách item name:\n'
  + 'Sai: { "name": "Phở Bò Nạm/Gầu/Gân", "price": 30000 }\n'
  + 'Đúng:\n'
  + '  { "name": "Phở Bò Nạm", "price": 30000 },\n'
  + '  { "name": "Phở Bò Gầu", "price": 30000 },\n'
  + '  { "name": "Phở Bò Gân", "price": 30000 }\n'
  + '\n'
  + 'CÁC QUY TẮC KHÁC:\n'
  + '- "price": số nguyên VND, 25k→25000, free→0\n'
  + '- Kích cỡ: thêm (Nhỏ)/(Vừa)/(Lớn) vào tên, tách thành item riêng\n'
  + '- "sortOrder": 0, 1, 2... theo thứ tự xuất hiện\n'
  + '- Nếu không trích xuất được, trả về { "categories": [] }';
