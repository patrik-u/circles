
# Install

## Deploying

Build steps for deploying to prod (circles-83729):

1. Modify `circles-client/src/Config.js` and uncomment the line for production build:

   `const config = configs.prod; // PRODUCTION`

   And make sure the lines for STAGING and DEV are commented out.

2. Build client by running the following commands in `circles-client/` folder:

   `firebase use prod`

   `npm run build`

   `firebase deploy`

4. Deploy source-maps for Sentry bug tracking. Without these the stack-trace is unreadable in Sentry. This requires the `sentry-cli.exe` to be downloaded first and put in the folder that contains the Circles repository (in this case `C:\Projects\`).  Run these commands to upload the source maps (`.\` needs to be included in the commands):

   1. `.\sentry-cli.exe releases new circles@0.2.0`
   2. `.\sentry-cli.exe releases files circles@0.2.0 upload-sourcemaps C:\Projects\Circles\circles\circles-client\build\`
   3. `.\sentry-cli.exe releases finalize circles@0.2.0`

   This assumes the client version deployed is `0.2.0` as specified in `package.json`

5. After deploy restore the `Config.js` and run `firebase use staging` to return to development/staging environment.

For deployment to staging (circles-325718), follow the same steps as above but uncomment:

`const config = configs.staging; // STAGING`

And run `firebase use staging` instead.