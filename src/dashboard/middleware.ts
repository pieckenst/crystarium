export { auth as middleware } from '@/lib/auth';

// Don't invoke Middleware on some paths
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
  unstable_allowDynamic: [
    '/lib/utilities.js', // allows a single file
    './**', // use a glob to allow anything in the function-bind 3rd party module
  ],
};
