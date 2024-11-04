import { withAuth } from 'next-auth/middleware';

export default withAuth({
  // Matches the pages config in `[...nextauth]`
  pages: {
    signIn: '/login'
  }
});

export const config = {
  matcher: [
    '/setting',
    '/my-offer',
    '/my-order',
    '/my-dispute',
    // '/order-detail',
    '/wallet',
    // '/dispute-detail',
    '/import'
  ]
};
