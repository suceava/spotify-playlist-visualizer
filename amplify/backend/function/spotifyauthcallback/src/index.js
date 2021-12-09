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

// GET: /auth/callback
exports.handler = async (event) => {
  console.log('event handler', event);

  const { Parameters } = await (new aws.SSM())
    .getParameters({
      Names: ["SPOTIFY_CLIENT_ID","SPOTIFY_CLIENT_SECRET"].map(secretName => process.env[secretName]),
      WithDecryption: true,
    })
    .promise();
  const SPOTIFY_CLIENT_ID = Parameters[0].Value;
  const SPOTIFY_CLIENT_SECRET = Parameters[1].Value;

  const { code } = event.queryStringParameters;

  const authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    form: {
      code,
      redirect_uri: 'http://localhost:3000/auth/callback',
      grant_type: 'authorization_code'
    },
    headers: {
      'Authorization': `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    json: true
  };

  const response = await (new aws.Request('POST', authOptions)).send();
  const { access_token } = await response.data;

  return {
    statusCode: 200,
    body: JSON.stringify({ access_token })
  };
}
