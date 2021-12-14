/*
Use the following code to retrieve configured secrets from SSM:

const aws = require('aws-sdk');

const { Parameters } = await (new aws.SSM())
  .getParameters({
    Names: ["SPOTIFY_CLIENT_ID","SPOTIFY_CLIENT_SECRET"].map(secretName => process.env[secretName]),
    WithDecryption: true,
  })
  .promise();

Parameters will be of the form { Name: 'secretName', Value: 'secretValue', ... }[]
*/
const aws = require('aws-sdk');
const axios = require('axios');
const url = require('url');

// GET: /auth/callback
exports.handler = async (event) => {
  console.log(`EVENT: ${JSON.stringify(event)}`);

  const { Parameters } = await (new aws.SSM())
    .getParameters({
      Names: ["SPOTIFY_CLIENT_ID","SPOTIFY_CLIENT_SECRET"].map(secretName => process.env[secretName]),
      WithDecryption: true,
    })
    .promise();
  const SPOTIFY_CLIENT_ID = Parameters[0].Value;
  const SPOTIFY_CLIENT_SECRET = Parameters[1].Value;
  const AUTH_REDIRECT_URI = process.env.AUTH_REDIRECT_URI;

  const corsHeaders = {
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Origin': '*'
  };
  const params = new url.URLSearchParams({
    code: event.queryStringParameters.code,
    redirect_uri: AUTH_REDIRECT_URI,
    grant_type: 'authorization_code'
  });

  try {
    const response = await axios({
      method: 'post',
      url: 'https://accounts.spotify.com/api/token',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: params,
      responseType: 'json'
    });
    console.log(response);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        expires_in: response.data.expires_in
      })
    };
  } catch (error) {
    // on error return a 400 response
    return {
      statusCode: 400,
      headers: corsHeaders,
    };
  }
}
