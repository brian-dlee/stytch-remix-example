import * as stytch from 'stytch';

let client: stytch.Client;

// Initialize the Stytch client.
export const loadStytch = (projectId: string, secret: string, env: string) => {
  if (!client) {
    client = new stytch.Client({
      project_id: projectId,
      secret,
      env: env === 'live' ? stytch.envs.live : stytch.envs.test,
    });
  }

  return client;
};
