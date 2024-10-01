import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import DiscordProvider from 'next-auth/providers/discord';

const authConfig = NextAuth({
  providers: [
   
    DiscordProvider({
      clientId: process.env.AUTH_DISCORD_CLIENT_ID as string,
      clientSecret: process.env.AUTH_DISCORD_CLIENT_SECRET as string,
    }),
  ]
});

export const { handlers = {}, signIn, signOut, auth } = authConfig;
export const { GET, POST } = handlers as { GET: any; POST: any };