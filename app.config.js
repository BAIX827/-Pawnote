// Adds the sub-path a host serves the web build from (GitHub Pages: /-Pawnote).
// Unset everywhere else, so local development and root-hosted builds are unchanged.
module.exports = ({ config }) => ({
  ...config,
  experiments: {
    ...config.experiments,
    ...(process.env.EXPO_BASE_URL ? { baseUrl: process.env.EXPO_BASE_URL } : {}),
  },
});
