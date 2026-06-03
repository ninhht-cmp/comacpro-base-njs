import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';
import { env } from '@/config/env';

export const runtime = 'nodejs';

const Body = z
  .object({
    tags: z.array(z.string().min(1)).optional(),
    paths: z.array(z.string().startsWith('/')).optional(),
  })
  .refine((b) => (b.tags?.length ?? 0) + (b.paths?.length ?? 0) > 0, {
    message: 'Provide at least one tag or path',
  });

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function POST(request: Request) {
  const secret = env.REVALIDATE_SECRET;
  if (!secret) {
    return Response.json(
      { error: 'Revalidation is not configured' },
      { status: 503 },
    );
  }

  const header = request.headers.get('authorization') ?? '';
  const provided = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!provided || !timingSafeEqual(provided, secret)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { error: 'Invalid body', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { tags = [], paths = [] } = parsed.data;
  for (const tag of tags) revalidateTag(tag, 'max');
  for (const path of paths) revalidatePath(path);

  return Response.json({
    revalidated: true,
    tags,
    paths,
    timestamp: Date.now(),
  });
}
