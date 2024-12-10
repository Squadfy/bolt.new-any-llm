import { type ActionFunctionArgs } from '@remix-run/cloudflare';
import admin from 'firebase-admin';
import jwt from 'jsonwebtoken';

const SECRET_SALT = process.env.SECRET_SALT;
const VITE_FIREBASE_PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID;

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: VITE_FIREBASE_PROJECT_ID,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  try {
    const { idToken } = await request.json<{ idToken: string }>();

    if (!idToken) {
      throw new Response('Missing idToken', {
        status: 400,
        statusText: 'Bad Request',
      });
    }

    // Verify Firebase ID Token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { email, uid } = decodedToken;

    if (!email) {
      throw new Response('Invalid Firebase token: No email found', {
        status: 400,
        statusText: 'Bad Request',
      });
    }

    // Generate a secure backend token
    const backendToken = jwt.sign(
      {
        email,
        uid,
      },
      `${SECRET_SALT}`,
      {
        expiresIn: '7d',
        algorithm: 'HS256',
      },
    );

    return new Response(JSON.stringify({ token: backendToken }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error during authentication:', error);

    return new Response('Authentication failed', {
      status: 500,
      statusText: 'Internal Server Error',
    });
  }
}
