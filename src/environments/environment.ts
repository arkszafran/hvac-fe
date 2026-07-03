export const environment = {
  production: true,
  api: {
    baseUrl: 'http://localhost:3000',
    withCredentials: true,
    authRefreshExcludedPathPrefixes: ['/authentication'],
  },
  auth: {
    activeUserRedirectPath: 'dashboard',
  },
  toast: {
    autoDismissMs: 5000,
  },
};
