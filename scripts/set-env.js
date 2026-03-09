import { writeFileSync } from 'node:fs';
import { env } from 'node:process';

const envConfig = `
  export const firebaseConfig = {
  production: true,
  apiKey: "${env.API_KEY}",
  authDomain: "${env.AUTH_DOMAIN}",
  databaseURL: "${env.DATABASE_URL}",
  projectId: "${env.PROJECT_ID}",
  storageBucket: "${env.STORAGE_BUCKET}",
  messagingSenderId: "${env.MESSAGING_SENDER_ID}",
  appId: "${env.APP_ID}",
  measurementId: "${process.env.MEASUREMENT_ID}"
};
`;

writeFileSync('./src/environments/environment.prod.ts', envConfig);
