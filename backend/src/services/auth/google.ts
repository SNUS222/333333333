import { OAuth2Client } from "google-auth-library";
import { env } from "../../config/env.js";
import { unauthorized } from "../../utils/errors.js";

let client: OAuth2Client | null = null;

function getClient(): OAuth2Client {
  if (!client) client = new OAuth2Client(env.GOOGLE_CLIENT_ID);
  return client;
}

export interface GoogleProfile {
  googleId: string;
  email: string;
  name?: string;
  picture?: string;
}

export async function verifyGoogleIdToken(idToken: string): Promise<GoogleProfile> {
  if (!env.GOOGLE_CLIENT_ID) throw unauthorized("Google OAuth not configured");
  const ticket = await getClient().verifyIdToken({ idToken, audience: env.GOOGLE_CLIENT_ID });
  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email) throw unauthorized("Invalid Google token");
  return {
    googleId: payload.sub,
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
  };
}
