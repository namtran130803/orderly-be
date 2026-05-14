import { z } from 'zod';

export const registerSchema = z.object({
  name:     z.string().trim().min(1, 'Tên không được để trống').max(100),
  phone:    z.string().regex(/^(0|\+84)[3-9]\d{8}$/, 'Số điện thoại không hợp lệ'),
  password: z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự'),
});

export const loginSchema = z.object({
  phone:    z.string().regex(/^(0|\+84)[3-9]\d{8}$/, 'Số điện thoại không hợp lệ'),
  password: z.string().min(1, 'Mật khẩu không được để trống'),
});

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
