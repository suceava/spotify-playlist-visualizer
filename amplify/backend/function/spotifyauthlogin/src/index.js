const aws = require('aws-sdk');

// GET: /auth/login
exports.handler = async (event, context) => {
  console.log(`EVENT: ${JSON.stringify(event)}`);

  const { Parameters } = await (new aws.SSM())
    .getParameters({
      Names: ["SPOTIFY_CLIENT_ID","SPOTIFY_CLIENT_SECRET"].map(secretName => process.env[secretName]),
      WithDecryption: true,
    })
    .promise();
  const SPOTIFY_CLIENT_ID = Parameters[0].Value;

  const scope = "streaming user-read-email user-read-private";
  const state = "randomState";

  const auth_query_parameters = new URLSearchParams({
    response_type: "code",
    client_id: SPOTIFY_CLIENT_ID,
    scope: scope,
    redirect_uri: "http://localhost:3000/auth/callback",
    state: state
  });

  // redirect to spotify auth
  return {
    statusCode: 302,
    headers: {
      Location: `https://accounts.spotify.com/authorize?${auth_query_parameters.toString()}`
    }
  };
};
