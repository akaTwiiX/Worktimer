const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();

const envConfig = `
  export const firebaseConfig = {
  production: true,
  apiKey: "${process.env.API_KEY}",
  authDomain: "${process.env.AUTH_DOMAIN}",
  databaseURL: "${process.env.DATABASE_URL}",
  projectId: "${process.env.PROJECT_ID}",
  storageBucket: "${process.env.STORAGE_BUCKET}",
  messagingSenderId: "${process.env.MESSAGING_SENDER_ID}",
  appId: "${process.env.APP_ID}",
  measurementId: "${process.env.MEASUREMENT_ID}"
};
`;

fs.writeFileSync('./src/environments/environment.prod.ts', envConfig);
