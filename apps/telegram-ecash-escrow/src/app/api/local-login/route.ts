import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { LocalUser } from 'src/shared/models/localUser';
import { sessionOptions } from 'src/shared/models/session';

export async function POST(req) {
  const session: any = await getIronSession(await cookies(), sessionOptions);
  const { id, address, name } = await req.body;

  const localUser: LocalUser = {
    isLocalLoggedIn: true,
    id,
    address,
    name
  };

  session.localUser = localUser;
  await session.save();

  return NextResponse.json({
    ok: true
  });
}
