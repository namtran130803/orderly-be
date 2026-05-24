export const ANALYSIS_EXPENSE_PROMPT =
  'Liệt kê các khoản chi tiêu trong ảnh theo khuôn mẫu sau, KHÔNG THÊM BẤT KỲ CHỮ NÀO KHÁC:\n'
  + '\n'
  + 'KHUÔN MẪU:\n'
  + '1. Tiêu đề: Số tiền (Ngày)\n'
  + '2. Tiêu đề 2: Số tiền 2 (Ngày 2)\n'
  + '\n'
  + 'QUY TẮC:\n'
  + '- Chỉ dùng tiếng Việt\n'
  + '- Giá viết gọn: 25k\n'
  + '- Nếu ảnh có nhiều khoản, liệt kê từng khoản riêng biệt\n'
  + '- Nếu không rõ ngày thì bỏ qua (Ngày)\n'
  + '- Viết hoa chữ đầu mỗi từ của tiêu đề\n'
  + '- Không markdown, không lời giới thiệu/kết luận';

export const GENERATION_EXPENSE_PROMPT =
  'Trích xuất danh sách chi tiêu thành JSON đúng khuôn mẫu này, KHÔNG THÊM CHỮ NÀO KHÁC NGOÀI JSON:\n'
  + '\n'
  + '[\n'
  + '  { "title": "Tiêu đề chi tiêu", "amount": 25000, "rawDate": "2024-01-15" },\n'
  + '  { "title": "Tiêu đề 2", "amount": 50000 }\n'
  + ']\n'
  + '\n'
  + 'QUY TẮC:\n'
  + '- "title": viết hoa chữ cái đầu mỗi từ\n'
  + '- "amount": số nguyên VND, 25k→25000, free→0\n'
  + '- "rawDate": Chuỗi ISO date YYYY-MM-DD, nếu không có ngày thì bỏ qua field này\n'
  + '- Trả về mảng JSON, KHÔNG bọc trong object\n'
  + '- Nếu không trích xuất được, trả về []';
