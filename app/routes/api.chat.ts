import { type ActionFunctionArgs } from '@remix-run/cloudflare';
import { MAX_RESPONSE_SEGMENTS, MAX_TOKENS } from '~/lib/.server/llm/constants';
import { CONTINUE_PROMPT } from '~/lib/.server/llm/prompts';
import { streamText, type Messages, type StreamingOptions } from '~/lib/.server/llm/stream-text';
import SwitchableStream from '~/lib/.server/llm/switchable-stream';
import jwt from 'jsonwebtoken';

export async function action(args: ActionFunctionArgs) {
  return chatAction(args);
}

function parseCookies(cookieHeader: string) {
  const cookies: any = {};

  // Split the cookie string by semicolons and spaces
  const items = cookieHeader.split(';').map((cookie) => cookie.trim());

  items.forEach((item) => {
    const [name, ...rest] = item.split('=');

    if (name && rest) {
      // Decode the name and value, and join value parts in case it contains '='
      const decodedName = decodeURIComponent(name.trim());
      const decodedValue = decodeURIComponent(rest.join('=').trim());
      cookies[decodedName] = decodedValue;
    }
  });

  return cookies;
}

export function validateToken(request: Request<unknown, CfProperties<unknown>>) {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Response('Missing or malformed Authorization header', {
      status: 401,
      statusText: 'Unauthorized',
    });
  }

  const token = authHeader.slice(7);
  let decoded = null;

  try {
    decoded = jwt.verify(token, process.env.SECRET_SALT as string);
  } catch (error: any) {
    if (error.message === 'jwt expired') {
      throw new Response('Token expired', {
        status: 401,
        statusText: 'Unauthorized',
      });
    }

    throw new Response('Invalid token', {
      status: 401,
      statusText: 'Unauthorized',
    });
  }

  const { email } = decoded as unknown as { email: string; uid: string; exp: number; iat: number };

  if (!email.endsWith('@squadfy.com.br')) {
    throw new Response('Apenas emails @squadfy.com.br são permitidos.', {
      status: 401,
      statusText: 'Unauthorized',
    });
  }
}

async function chatAction({ context, request }: ActionFunctionArgs) {
  validateToken(request);

  const { messages } = await request.json<{
    messages: Messages;
    model: string;
  }>();

  const cookieHeader = request.headers.get('Cookie');

  // Parse the cookie's value (returns an object or null if no cookie exists)
  const apiKeys = JSON.parse(parseCookies(cookieHeader || '').apiKeys || '{}');

  const stream = new SwitchableStream();

  try {
    const options: StreamingOptions = {
      toolChoice: 'none',
      onFinish: async ({ text: content, finishReason }) => {
        if (finishReason !== 'length') {
          return stream.close();
        }

        if (stream.switches >= MAX_RESPONSE_SEGMENTS) {
          throw Error('Cannot continue message: Maximum segments reached');
        }

        const switchesLeft = MAX_RESPONSE_SEGMENTS - stream.switches;

        console.log(`Reached max token limit (${MAX_TOKENS}): Continuing message (${switchesLeft} switches left)`);

        messages.push({ role: 'assistant', content });
        messages.push({ role: 'user', content: CONTINUE_PROMPT });

        const result = await streamText(messages, context.cloudflare.env, options, apiKeys);

        return stream.switchSource(result.toAIStream());
      },
    };

    const result = await streamText(messages, context.cloudflare.env, options, apiKeys);

    stream.switchSource(result.toAIStream());

    return new Response(stream.readable, {
      status: 200,
      headers: {
        contentType: 'text/plain; charset=utf-8',
      },
    });
  } catch (error: any) {
    if (error.message?.includes('API key')) {
      throw new Response('Invalid or missing API key', {
        status: 401,
        statusText: 'Unauthorized',
      });
    }

    throw new Response(null, {
      status: 500,
      statusText: 'Internal Server Error',
    });
  }
}
