# New Instance Guide

[TOC]

## Introduction

This guide explains the steps required to set up a new instance of Circles.



## Preparation 

You need a google account tied to your organization that will be used to register all third-party services that your instance of Circles will use. You'll also need to be prepared to register a credit card for billing. Services used are pay as you go so there won't be any initial costs for setting up the instance.

1. Register a google account If you haven't already register a new google account by using your organization email or creating a new email.



## Get Circles source

Clone the Circles git repository at https://github.com/patrik-u/circles

The repository contains both the backend and frontend code that will be deployed on your new instance's backend.



## Setting up Firebase

Firebase cloud services is the application backend that handles user authentication, database, file storage, computing and hosting. 

1. Go to https://firebase.google.com/ and click on "Get Started"
2. Click on "Create Project" and pick a name for your instance (e.g. the name of your organization/network). 
3. Enabling google analytics is optional.

When you've gone through the steps you should be taken to the Firebase console. 



### Set up billing plan

In the Firebase console, change the billing plan on your account by clicking on the pill next to your project name that says "Spark plan". Select the plan "Blaze - pay as you go" and go through the process of creating a new billing account. Afterwards you might need to click on "Spark plan" again and select "Blaze" and confirm the purchase. The plan is pay as you go so there won't be any initial costs.



### Creating the Web App

1. In the Firebase console underneath "Get started by adding Firebase to your app" click on the Web Icon `</>`

2. Choose a name for the app, e.g. the same name as the project. 

3. Check the box "Also set up Firebase Hosting for this app".

4. In the next step (2) copy the json object for the Firebase configuration. E.g:

   ```
   {
     apiKey: "*******",
     authDomain: "yourproject.firebaseapp.com",
     projectId: "yourproject",
     storageBucket: "yourproject.appspot.com",
     messagingSenderId: "*****",
     appId: "*****"
   };
   ```

   You'll need this to configure your Circles instance code to use the firebase backend. You can access this information later in the app settings in the firebase console.

5. Install Firebase CLI. Follow the instructions in the next step (3) to install the firebase command line tool. It's used to run commands to deploy your project to the backend.

6. Run the command `firebase login` in a terminal window at your project root (that contains the `/src` folder)

   

## Configuring the Circles code to use backend

1. Modify firebase deploy targets in  `circles\.firebaserc` to point to the ID of your project (you see your project ID in the json object in the step above):

   ```
   {
     "projects": {
       "default": "yourproject",
       "staging": "yourproject",
       "prod": "yourproject"
     },
     "targets": {}
   }
   ```

   Note: If you later want to add another staging instance for testing you need to go through the steps of creating a new Firebase project, etc. And then under "staging" and "default" specify the ID of the staging project. 

2. In the source modify `circles\src\Config.js` to use your project backend:

   ```
   const configs = {
       dev: {
           environment: "dev",
           apiUrl: "http://localhost:5001/yourproject/europe-west1/api",
           firebase: {
               apiKey: "*****",
               authDomain: "yourproject.firebaseapp.com",
               projectId: "yourproject",
               storageBucket: "yourproject.appspot.com",
               messagingSenderId: "*****",
               appId: "*****",
               measurementId: "*****",
           },
           googleId: "****",
           imageKitEndpoint: "***",
           logLevel: 0,
           algoliaId: "****",
           algoliaSearchKey: "****",
           algoliaCirclesIndex: "circles",
           alwaysShowGuide: false,
           oneSignalAppId: "****",
       },
       prod: {
           environment: "prod",
           apiUrl: "https://europe-west1-yourproject.cloudfunctions.net/api",
           firebase: {
               apiKey: "*****",
               authDomain: "yourproject.firebaseapp.com",
               projectId: "yourproject",
               storageBucket: "yourproject.appspot.com",
               messagingSenderId: "*****",
               appId: "*****",
               measurementId: "*****",
           },
           googleId: "****",
           imageKitEndpoint: "***",
           logLevel: 0,
           algoliaId: "****",
           algoliaSearchKey: "****",
           algoliaCirclesIndex: "circles",
           alwaysShowGuide: false,
           oneSignalAppId: "****",
       },,
   };
   
   const getConfig = () => {
       switch (process.env.REACT_APP_ENVIRONMENT) {
           default:
           case "dev":
               return configs.dev;
           case "staging":
               return configs.prod;
           case "prod":
               return configs.prod;
       }
   };
   
   const config = getConfig();
   
export default config;
   ```
   
   Replace the "firebase" field in the config objects with the one you saved in the previous step. The rest of the settings, the Google ID, Algolia settings (search)  and OneSignal (push notifications) will be set in later steps in this guide as those services are set up.



## Configuring Hosting

The following steps are to initiate hosting and to make sure your custom domain points to the website hosted on firebase.

1. Click on "Hosting" in the firebase console (under the "Build" expandable menu on the left). 
2. Click on "Get started" and just push next on the wizard until you get to the Hosting Dashboard.
3. Click on "Add Custom Domain" and enter the name of your domain, e.g. `yourprojectname.com` (recommended to repeat the process to also add  `www.yourprojectname.com`) and click continue.
4. Follow the instruction to add records to your DNS provider, there might be additional steps here to verify you own the domain.



## Adding Secret Manager API

1. In the project root run `npm run deploy:prod` to attempt to deploy the app to backend.
2. You'll get an error about Secret Manager API not being enabled. Open the web link provided in the terminal and click on "Enable" on the page.



## Configuring Database

1. Click on "Firestore Database" in firestore console menu and click on "Create database". Click next.
2. Choose location, we using eur3 (Europe) in this guide, and click Enable.
3. Click on "+ Start collection" in the Cloud Firestore data view.
4. Set Collection ID to "config" and click Next.
5. Set Document ID to "config"
6. Add field with name "host_url" type "string" and as value set your project url (https://yourproject.com), if you set up a custom domain in Configuring Hosting then use that one otherwise use the url to firebase host url. Click save.



## Configuring OneSignal

OneSignal is used to send push notifications to users as they receive new messages and notifications. 

1. Go to [onesignal.com](onesignal.com)

2. Sing up to a new account. Choose the Free tier. Click "Complete Later" on the quick start guide.

3. Click on "Setup Platform"

4. On the "Web" section, click "Activate".

5. Under Site Setup choose "Typical Site" and enter your site name, url and upload your app icon that will be shown when user subscribes to messages in the app. You can leave the rest of the settings as is or customize it as you wish. Click save.

6. The web configuration is already done so you can click on "finish". Now the platform is set up.

7. Now we need to add the keys. In the top submenu choose "Keys & IDs". Copy the OneSignal App ID.

8. Add the key to the Config.js file under the field `oneSignalAppId`. Do it for all environment configs.

9. Enter the following command into the terminal: 
   `firebase functions:secrets:set ONESIGNAL_APP_ID`
   And when prompted paste the copied OneSignal App ID (by right clicking with your mouse), note that the text remains hidden in the terminal.

10. Go to the OneSignal page again and copy the API KEY. Enter the following command into the terminal:

    `firebase functions:secrets:set ONESIGNAL_API_KEY`

    And when prompted paste the copied OneSignal API Key and press enter.



## Configuring Algolia Search

Algolia is used to provide search functionality in the app.

1. Create an Algolia account at https://www.algolia.com/users/sign_in

2. Set the name of your index to "circles"

3. Click on the small cog in the lower left of the page. Click on Applications. Click on the dots on the right to rename the application to your project.

4. Click on your application

5. Click on "Search" in the left menu

6. Click on "Configuration" in the top menu on the Index page. 

7. Add the following searchable attributes:

   ```
   name
   description
   content
   tags.text
   questions.question0.answer
   questions.question1.answer
   questions.question2.answer
   ```

   Set `name` to be ordered.

8. Click on *facets* in the left submenu under the "Filtering and faceting" section. Add the attributes for facets: 

   ```
   tags.text
   types
   ```

9. Click on the button "Review and save settings" and confirm.

10. Click on the cog on the lower left and click on API Keys under the "Team and Access" section.

11. Copy the Application ID and add it to Config.js under the field `algoliaId`

12. Go back to the Algolia page and copy the "Search Only API Key" and add it to Config.js under the field `algoliaSearchKey`

13. Go to the [firebase console](https://console.firebase.google.com/) and click on "Extensions" in the left menu in the Build category.

14. Search for the extension "Search with Algolia" and choose "Install"

15. Click next and in the second step you might need to click on enable "Cloud functions". 

16. Click next until you get to step (4). Here choose:

    ```
    Collection Path: circles
    Indexable Fields: (leave as is)
    Algolia Index Name: circles
    Algolia Application Id: <the one in step 11>
    Algolia API Key: <follow the steps to create new key>
    ```

    So for the Algolia Application Id you choose the one in step 11. For the Algolia API Key you need to follow the steps in this [guide](https://www.algolia.com/doc/guides/security/api-keys/#creating-and-managing-api-keys) to create a new key with permissions. Once created copy the key ID and click on create secret. 

    

    

## Configuring OpenAI

1. For now enter the following command into the terminal:

   `firebase functions:secrets:set OPENAI`

   And when prompted just write "empty" for now and click enter.



## Configuring User Authentication

User authentication allows the user to sign into the app using username & password or google.

1. Go to the firebase console https://firebase.google.com/ 
2. Click on "Authentication" in the menu on the left and then click on the "Get started button"
3. Click on "Email/Password" in the list of sign-in providers. Enable it and click on "Save". Email link you can ignore for now.
4. Click on "Add new provider" and choose "Google" in the list of sign-in providers.
5. Enable it and choose a public-facing name that is the name of your project/app that is shown to users as they sign in through google. Click on "save".
6. Click on the Google provider in the list and expand the "Web SDK configuration" section. Copy the "Web client ID" value and add it to the `Config.js` under the field `googleId`



If you have a custom domain as added in the "Configuring Hosting", you need to add it to allowed origins: 

1. Go to https://console.cloud.google.com/apis/

2. Click on "Credentials" in the left menu

3. Click on "Web client (auto created by Google Service)" under the OAuth 2.0 Client IDs section

4. Under the "authorized JavaScript origins" add the URLS, e.g:

   `https://yourdomain.com`

   `https://www.yourdomain.com`





## Deploying App

1. In the project root run: `npm run deploy:prod`