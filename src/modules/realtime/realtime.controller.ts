import { Request, Response, NextFunction } from 'express';
import { storeOrdersChannel } from '@/realtime/constants';
import { isRealtimeEnabled } from '@/realtime/config';
import { getPusherServer } from '@/realtime/pusher-server';
import { ApiError } from '@/lib/response';

export async function authChannel(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!isRealtimeEnabled()) {
      throw ApiError.internal('Realtime chưa được cấu hình');
    }

    const socketId = req.body?.socket_id as string | undefined;
    const channelName = req.body?.channel_name as string | undefined;
    if (!socketId || !channelName) {
      throw ApiError.badRequest('Thiếu socket_id hoặc channel_name');
    }

    const expected = storeOrdersChannel(req.store!.id);
    if (channelName !== expected) {
      throw ApiError.forbidden('Không được phép đăng ký kênh này');
    }

    const pusher = getPusherServer();
    if (!pusher) {
      throw ApiError.internal('Realtime chưa được cấu hình');
    }

    const auth = pusher.authorizeChannel(socketId, channelName);
    res.send(auth);
  } catch (err) {
    next(err);
  }
}
