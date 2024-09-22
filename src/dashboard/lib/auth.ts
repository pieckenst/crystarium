import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import DiscordProvider from 'next-auth/providers/discord';

const authConfig = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!
    }),
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID as string,
      clientSecret: process.env.DISCORD_CLIENT_SECRET as string,
    }),
  ]
});

export const { handlers = {}, signIn, signOut, auth } = authConfig;
export const { GET, POST } = handlers as { GET: any; POST: any };