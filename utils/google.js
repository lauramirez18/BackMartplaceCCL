import { OAuth2Client } from 'google-auth-library';

const googleConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.NODE_ENV === 'development' 
    ? 'http://localhost:5173/auth/google/callback' 
    : 'https://tudominio.com/auth/google/callback'
};

const oAuth2Client = new OAuth2Client(
  googleConfig.clientId,
  googleConfig.clientSecret,
  googleConfig.redirectUri
);

export const verifyGoogleToken = async (token) => {
  try {
    const ticket = await oAuth2Client.verifyIdToken({
      idToken: token,
      audience: googleConfig.clientId,
    });
    
    const payload = ticket.getPayload();
    
    return {
      googleId: payload.sub,
      name: payload.name,
      email: payload.email,
      emailVerified: payload.email_verified,
      picture: payload.picture,
      locale: payload.locale
    };
  } catch (error) {
    console.error('Error al verificar el token de Google:', error);
    throw new Error('Token de Google inválido');
  }
};

export const getTokensFromCode = async (code) => {
  try {
    const { tokens } = await oAuth2Client.getToken(code);
    return tokens;
  } catch (error) {
    console.error('Error al obtener tokens de Google:', error);
    throw new Error('Error en la autenticación con Google');
  }
};

export const getUserData = async (accessToken) => {
  try {
    oAuth2Client.setCredentials({ access_token: accessToken });
    
    const { data } = await oAuth2Client.request({
      url: 'https://people.googleapis.com/v1/people/me?personFields=names,emailAddresses,photos'
    });
    
    return {
      name: data.names[0].displayName,
      email: data.emailAddresses[0].value,
      picture: data.photos[0].url
    };
  } catch (error) {
    console.error('Error al obtener datos del usuario:', error);
    throw new Error('Error al obtener información del perfil');
  }
};

export const getAuthUrl = () => {
  return oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ],
    prompt: 'consent'
  });
};

export { oAuth2Client };