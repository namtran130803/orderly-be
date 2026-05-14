import { prisma } from '@/config/prisma';
import { ApiError } from '@/lib/response';
import { hashPassword, comparePassword } from '@/lib/hash';
import { signToken } from '@/lib/jwt';
import { RegisterDto, LoginDto } from '@/modules/auth/auth.schema';

export async function register(dto: RegisterDto) {
  // Kiểm tra số điện thoại đã tồn tại chưa
  const existingUser = await prisma.user.findUnique({
    where: { phone: dto.phone },
  });
  if (existingUser) {
    throw ApiError.conflict('Số điện thoại đã được sử dụng');
  }

  // Mã hóa mật khẩu
  const passwordHash = await hashPassword(dto.password);

  // Tạo người dùng mới
  const user = await prisma.user.create({
    data: {
      name: dto.name,
      phone: dto.phone,
      passwordHash,
    },
    select: {
      id: true,
      name: true,
      phone: true,
      createdAt: true,
    },
  });

  // Ký JWT
  const token = signToken(user.id);

  return { token, user };
}

export async function login(dto: LoginDto) {
  // Tìm người dùng theo số điện thoại
  const user = await prisma.user.findUnique({
    where: { phone: dto.phone },
  });
  if (!user) {
    throw ApiError.unauthorized('Số điện thoại hoặc mật khẩu không chính xác');
  }

  // Kiểm tra mật khẩu
  const isMatch = await comparePassword(dto.password, user.passwordHash);
  if (!isMatch) {
    throw ApiError.unauthorized('Số điện thoại hoặc mật khẩu không chính xác');
  }

  // Ký JWT
  const token = signToken(user.id);

  const userProfile = {
    id: user.id,
    name: user.name,
    phone: user.phone,
    createdAt: user.createdAt,
  };

  return { token, user: userProfile };
}

export async function getUserProfile(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      phone: true,
      createdAt: true,
    },
  });
  if (!user) {
    throw ApiError.notFound('User');
  }
  return user;
}
