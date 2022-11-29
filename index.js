import dotenv from 'dotenv';
import Express from 'express';
import nodefetch from 'node-fetch';

dotenv.config();

const app = Express();
app.use(Express.json());

const API_URL_BASE = 'https://www.donationalerts.com';
const API_SCOPES = ['oauth-user-show', 'oauth-donation-index', 'oauth-donation-subscribe'];

const API_ROUTES = {
  auth: '/oauth/authorize',
  token: '/oauth/token',
};

app.get('/', (req, res) => {
  let url = `${API_URL_BASE}${API_ROUTES.auth}`;
  const query = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.API_CLIENT_ID,
    redirect_uri: process.env.API_REDIRECT_URI,
    scope: API_SCOPES.join(' '),
  });
  url += `?${query.toString()}`;
  res.redirect(url);
});

app.get('/auth/donationalerts', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    res.status(400).send('No code provided');
    return;
  }

  const json = await getAccessToken(code);

  const query = new URLSearchParams({
    response: JSON.stringify(json),
  });

  res.redirect(`${process.env.SB_REDIRECT_URI}?${query.toString()}`);
});

app.post('/auth/donationalerts/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    res.status(400).send('No refresh token provided');
    return;
  }

  const json = await refreshAccessToken(refreshToken);
  res.json(json);
});

async function getAccessToken(code) {
  let url = `${API_URL_BASE}${API_ROUTES.token}`;
  const data = {
    grant_type: 'authorization_code',
    client_id: process.env.API_CLIENT_ID,
    client_secret: process.env.API_TOKEN,
    redirect_uri: process.env.API_REDIRECT_URI,
    code,
  };

  const query = new URLSearchParams(data);

  const resp = await nodefetch(url, {
    method: 'POST',
    body: query,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  const json = await resp.json();
  return json;
}

async function refreshAccessToken(refreshToken) {
  let url = `${API_URL_BASE}${API_ROUTES.token}`;
  const data = {
    grant_type: 'refresh_token',
    client_id: process.env.API_CLIENT_ID,
    client_secret: process.env.API_TOKEN,
    refresh_token: refreshToken,
    scope: API_SCOPES.join(' '),
  };

  const query = new URLSearchParams(data);

  const resp = await nodefetch(url, {
    method: 'POST',
    body: query,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  const json = await resp.json();
  return json;
}

app.listen(process.env.PORT, () => {
  console.log(`Example app listening at http://localhost:${process.env.PORT}`);
});
