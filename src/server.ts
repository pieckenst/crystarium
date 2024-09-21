import Fastify from 'fastify';
import next from 'next';
import { Harmonix } from './typedefinitions/harmonixtypes';

const dev = process.env.NODE_ENV !== 'production';
const { resolve } = require('path');
const dashboardPath = resolve(process.cwd(), 'dashboard');

const app = next({ dev, dir: dashboardPath });
const handle = app.getRequestHandler();

if (!dashboardPath) {
  console.error(`Dashboard folder not found at ${dashboardPath}`);
  throw new Error(`Dashboard folder not found at ${dashboardPath}`);
}

const server = Fastify();

export async function setupServer(harmonix: Harmonix) {
  await app.prepare();

  server.get('/api/commands', async (request, reply) => {
    const commands = Array.from(harmonix.commands.values()).map(cmd => ({
      name: cmd.name,
      description: cmd.description,
      category: cmd.category,
    }));
    return commands;
  });

  server.get('/api/featureflags', async (request, reply) => {
    return harmonix.options.featureFlags;
  });

  server.all('*', async (request, reply) => {
    return handle(request.raw, reply.raw);
  });

  server.setNotFoundHandler((request, reply) => {
    return app.render404(request.raw, reply.raw);
  });

  server.setErrorHandler((error, request, reply) => {
    console.error(error);
    return app.renderError(error, request.raw, reply.raw, request.url, {});
  });

  try {
    await server.listen({ port: 3000 });
    console.log('> Ready on http://localhost:3000');
  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
}

function keepAlive() {
    return new Promise<void>((resolve, reject) => {
        server.listen({ port: 3000 }, (err) => {
            if (err) {
                console.error('Error starting server:', err);
                reject(err);
            } else {
                console.log("Server is Ready!");
                resolve();
            }
        });
    });
}

export default keepAlive;