# School Spirit Week Voting Board

A simple school spirit voting app where students can add ideas for spirit week and vote on them from any device.

## Features
- Post new school spirit ideas
- See all ideas in one shared list
- Vote up or down on ideas
- Works on phones, tablets, and laptops
- Uses Firebase Firestore for live updating

## Setup
1. Create a Firebase project at https://console.firebase.google.com
2. Turn on Firestore Database
3. Replace the Firebase config values in `app.js` with your project settings
4. Deploy the Firestore rules from `firestore.rules`
5. Serve the files locally or deploy to Firebase Hosting

## Run locally
```bash
python -m http.server 8000
```
Then open:
```text
http://localhost:8000
```

## Deploy to Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

If you want to keep this really simple, you can also just use the static files with any normal web host.
