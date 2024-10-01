
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { signIn } from '@/lib/auth';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex justify-center items-center p-8 bg-background text-foreground dark:bg-background dark:text-foreground">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription className="dark:text-muted-foreground">
            Sign in with your Discord account to access the dashboard.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <form
            action={async () => {
              'use server';
              const currentUrl = typeof window !== 'undefined' ? window.location.href : '/';
              await signIn('discord', {
                redirectTo: currentUrl
              });
            }}
            className="w-full"
          >
            <Button className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white dark:bg-[#5865F2] dark:hover:bg-[#4752C4] dark:text-white">
              Sign in with Discord
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
