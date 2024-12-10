import { json, type MetaFunction } from '@remix-run/cloudflare';
import { useLocation } from '@remix-run/react';
import type { User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { AuthProvider, useAuth } from '~/components/auth/AuthContext';
import LoginPage from '~/components/auth/LoginPage';
import TokenStateProvider, { useTokenState } from '~/components/auth/TokenProvider';
import { BaseChat } from '~/components/chat/BaseChat';
import { Chat } from '~/components/chat/Chat.client';
import { Header } from '~/components/header/Header';
import { LoadingSpinner } from '~/components/ui/LoadingSpinner';
import { auth } from '~/firebaseConfig';

export const meta: MetaFunction = () => {
  return [{ title: 'Bolt' }, { name: 'description', content: 'Talk with Bolt, an AI assistant from StackBlitz' }];
};

export const loader = () => json({});

function InternalIndex() {
  const { user } = useAuth();
  const location = useLocation();
  const { token, setToken } = useTokenState();
  const [error, setError] = useState<string>('');

  const fetchBackendToken = async (user: User): Promise<null | string> => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken: await user.getIdToken() }),
      });

      if (!response.ok) {
        throw new Error('Failed to authenticate with backend');
      }

      const data = (await response.json()) as { token: string };

      return data?.token ?? null;
    } catch (error) {
      console.error('Error fetching backend token:', error);
    }

    return null;
  };

  const isLoginPage = (location.pathname + location.search).endsWith('?page=login');

  const userHasSquadfyEmail = user && user.email?.endsWith('@squadfy.com.br');

  useEffect(() => {
    const mainUrl = window.location.origin;
    const loginUrl = window.location.origin + '/?page=login';

    if (isLoginPage && token) {
      window.location.href = mainUrl;
    }

    if (!isLoginPage && !token) {
      window.location.href = loginUrl;
    }

    if (isLoginPage && !token && userHasSquadfyEmail) {
      fetchBackendToken(user).then((token) => {
        if (token === null) {
          auth.signOut();
          setError('Não foi possível fazer login.');

          return;
        }

        setError('');
        localStorage.setItem('backend_token', token);
        setToken(token);
      });
    }

    if (isLoginPage && !token && user && !userHasSquadfyEmail) {
      setError('Apenas emails @squadfy.com.br são aceitos.');
    }
  }, [user, token]);

  if (!isLoginPage && !token) {
    return <LoadingSpinner />;
  }

  if (isLoginPage && token) {
    return <LoadingSpinner />;
  }

  if (isLoginPage && !token && userHasSquadfyEmail) {
    return <LoadingSpinner />;
  }

  if (isLoginPage) {
    return <LoginPage error={error} />;
  }

  return (
    <div className="flex flex-col h-full w-full">
      <Header />
      <ClientOnly fallback={<BaseChat />}>{() => <Chat />}</ClientOnly>
    </div>
  );
}

export default function Index() {
  return (
    <AuthProvider>
      <TokenStateProvider>
        <InternalIndex />
      </TokenStateProvider>
    </AuthProvider>
  );
}
