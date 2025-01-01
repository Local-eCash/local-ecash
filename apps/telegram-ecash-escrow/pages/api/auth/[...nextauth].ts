import { AuthDataValidator, objectToAuthDataMap } from '@telegram-auth/server';
import _ from 'lodash';
import type { NextApiRequest, NextApiResponse } from 'next';
import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export type User = {
  id: string;
  name: string;
  image: string;
};

declare module 'next-auth' {
  interface Session {
    user: User;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'telegram-login',
      name: 'Telegram Login',
      credentials: {},
      async authorize(credentials, req) {
        try {
          let user;
          const validator = new AuthDataValidator({
            botToken: `${process.env.BOT_TOKEN}`
          });

          if (!req.query.isMiniApp) {
            const data = objectToAuthDataMap(req.query || {});
            user = await validator.validate(data);
          } else {
            user = req.query;
          }

          const fullname = !_.isEmpty(user.last_name) ? [user.first_name, user.last_name].join(' ') : user.first_name;
          const username =
            !_.isEmpty(user.username) && !_.isNil(user.username) && user.username !== 'undefined'
              ? `@${user.username}`
              : fullname;

          if (user.id && user.first_name) {
            return {
              id: user.id.toString(),
              name: username,
              image: user.photo_url
            };
          }
        } catch (e) {
          console.log('authorize error: ', e);
        }

        return null;
      }
    })
  ],
  callbacks: {
    session: async ({ session, token }) => {
      try {
        if (session?.user) {
          session.user.id = token.sub as string;
          session.user.image = token.picture as string;
        }

        return session;
      } catch (e) {
        console.log('session error: ', e);
      }
    },
    jwt: async ({ user, token }) => {
      try {
        if (user) {
          token.uid = user.id;
          token.picture = user.image;
        }

        return token;
      } catch (e) {
        console.log('jwt error: ', e);
      }
    },
    async redirect(params: { url: string }) {
      const { url } = params;

      // url is just a path, e.g.: /videos/pets
      if (!url.startsWith('http')) return url;

      // If we have a callback use only its relative path
      const callbackUrl = new URL(url).searchParams.get('callbackUrl');
      if (!callbackUrl) return url;

      return new URL(callbackUrl as string).pathname;
    }
  },
  session: {
    strategy: 'jwt',
    maxAge: 15552000 // 6 months
  },
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'none',
        path: '/',
        secure: true
      }
    },
    callbackUrl: {
      name: `__Secure-next-auth.callback-url`,
      options: {
        sameSite: 'none',
        path: '/',
        secure: true
      }
    },
    csrfToken: {
      name: `__Host-next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'none',
        path: '/',
        secure: true
      }
    }
  }
};

export default async function auth(req: NextApiRequest, res: NextApiResponse) {
  // Do whatever you want here, before the request is passed down to `NextAuth`
  return await NextAuth(req, res, authOptions);
}
