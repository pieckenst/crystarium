import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { auth, signIn, signOut } from '@/lib/auth';



export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const [featureFlags, setFeatureFlags] = useState({});
  const [commands, setCommands] = useState([]);

  useEffect(() => {
    setMounted(true);
    fetchFeatureFlags();
    fetchCommands();
  }, []);

  const fetchFeatureFlags = async () => {
    const response = await fetch('/api/featureflags');
    const data = await response.json();
    setFeatureFlags(data);
  };

  const fetchCommands = async () => {
    const response = await fetch('/api/commands');
    const data = await response.json();
    setCommands(data);
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1 className="text-4xl font-bold mb-4">Terra Dashboard</h1>
      <Button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
        Toggle Theme
      </Button>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Feature Flags</CardTitle>
        </CardHeader>
        <CardContent>
          <pre>{JSON.stringify(featureFlags, null, 2)}</pre>
        </CardContent>
      </Card>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Commands</CardTitle>
        </CardHeader>
        <CardContent>
          <ul>
            {commands.map((cmd: any) => (
              <li key={cmd.name}>{cmd.name} - {cmd.description}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
