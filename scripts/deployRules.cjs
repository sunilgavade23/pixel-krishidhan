/**
 * KrishiDhan — Deploy Firestore Security Rules via REST API
 * Run: node scripts/deployRules.cjs
 */
const fs = require('fs');
const path = require('path');
const { GoogleAuth } = require('google-auth-library');

const PROJECT_ID = 'krishidhan-94366';

const serviceAccount = {
  type: "service_account",
  project_id: PROJECT_ID,
  private_key_id: "05c10a07a37366f8a98127f84f1a7937df973b5b",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC9eLPp8bVrjSwY\nBbuHGanEFUXBQc6RHaiOwifZApPfiVwSJaF0qEyqdaWVvn+B4imdh2KIA869BDpe\nfwLiizVk/Zd1unIphVRhSdSc4OO5Nr417JI024FFrjNVK4FYJkbSxS8mMc/p3YtX\n/0IDKATrsi9IBpf77mveR1UGQCvMrO8u1eZoFg+HKbtlo3fJXWdiqJ0eJ+g0nVRT\nl7BuFhNGf+2DUTRJ32sGiEMpLPTfjcQ9kXqXOqkK4MxXIqHVyhxSsgxs+eZrftnX\n3CReNfkgn0/ED3iGLZqDL1QwDxam3Ghhx7BnVFU8TUJU4quk0OTxToOOaFh0f1nF\nqcp+fLlBAgMBAAECggEAUTIJv8aSXX3JGJ5UR8gqpVoMY45E7JFOK6duliPxpMjj\niO9RaoG5IQ97n1lcoRd/h/99rRYcoYnPTbGWVekcP6QhJRV6WOrHR03xbC0/yZ55\nEvjHixlKI8dMPkJ/knwMu8Q+uVp9ZBZJ4bME4f9jZHIeqvoQZak91qqw+BXF71ar\nDMDvkfpmazELsuq0DUqlADJkpTcOcFUCYhfSlEOz5bfqTF05udim/aamfuvpZDMj\nXMzBzRPG1Ikjp0FCIFtyVkQ3hWmoS1mra54HUGB9df+RTlo9xAd/nE8Cjv01WIbp\nReM5MyuqATh3Xop6Imt8VGkJnJr6MaFKpaBSuE93sQKBgQD0gkWJbGQwWsClh6xv\nkef1MmwIiPlP8DTMQM/FxDjUKzL8WHMJq/3IPMoLIaOS+E5VNO/5mOhE4xPLDF3O\nfDxNfRfVgQjpAjz4CzQ66H9XfEjI3Z8Cj/HmSvj8FJ+rXfNYMJ2IKnYr3YeE59k\nx7RXfF3VGhW5zB89cSt8Dk/bPQKBgQDGkN0RN4FGvJAcV8SXEV7o1F8BcFPMY8vT\neLEXe49R4YLmNrniJ3GVBm05eMSL7q/yMxicOEJDa/RqNH0N7JiPIiGsPgB0dHjH\noX7QBhZNjI+UyFP7iuFMrCNf3r7NLlRh/FtRSHiJVXX6Z5qe6kVGGhD1e5G5VuE/\nG5BoJvAV3QKBgG+R6QWx2CKr5FXPFG6gm94p7LBnFxlJym4xR22t2yd7WdR7VaF4\nL15qGHwQ0j3KFLZ8gUlF4kY8SVZjhJaI8NVx1yfvEC/KiGFYUBMbPOI3c3zBo8pQ\nR7xz+cAN7g2TZFx1Y8qLdFMrJNLv2qJ/5sjQK9C9p7kR5B75r4RCAORtAoGBAKXq\nDOhX/6YidCl5wqMdN8/NjT1z2d5Iu9EUJ8VVNoFVDE+V6nT1XVjZ8FjKQyFP7V7w\nK8OX5F0rXKIBxQyhOqJI5W3HEZPGbrM7t/0Kg5g9X2k5A0cO2h3t3V5sSzXXGaHZ\nvSm4iAKl3EhPnAqB3LlxFPryGt/+YVxRNuH9eVvdAoGBAOIfN3g9cB59JvSTxTl3\noTGvRbU5F6BECzb/YNjKQ5gh9GBFvJLRIHlsBKCiIyFERcqZHmPP3UB3dKGPJ2nB\noYexXOcBi7oe5/5W3mnW3G6oIGhIbpZOLq8BV6RaIvGjkXm3cGqLvP1fM9qrDfKT\nqp8h3WEQ4IGf1AH/J3hG6oWa\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-fbsvc@krishidhan-94366.iam.gserviceaccount.com",
  client_id: "106491666779698044810",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
};

async function deployRules() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 KrishiDhan — Deploy Firestore Security Rules');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Read local rules file
  const rulesPath = path.resolve(__dirname, '..', '..', 'firestore.rules');
  const rulesSource = fs.readFileSync(rulesPath, 'utf-8');
  console.log(`\nRead rules from: ${rulesPath}`);
  console.log(`Rules size: ${rulesSource.length} bytes\n`);

  // Authenticate with service account
  const auth = new GoogleAuth({
    credentials: serviceAccount,
    scopes: ['https://www.googleapis.com/auth/cloud-platform', 'https://www.googleapis.com/auth/firebase'],
  });

  const client = await auth.getClient();
  const token = await client.getAccessToken();

  // Step 1: Create a new ruleset
  const createUrl = `https://firebaserules.googleapis.com/v1/projects/${PROJECT_ID}/rulesets`;
  const createBody = {
    source: {
      files: [
        {
          name: 'firestore.rules',
          content: rulesSource,
        },
      ],
    },
  };

  console.log('Creating ruleset...');
  const createRes = await fetch(createUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(createBody),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    console.error(`❌ Failed to create ruleset: ${createRes.status} ${errText}`);
    process.exit(1);
  }

  const ruleset = await createRes.json();
  const rulesetName = ruleset.name;
  console.log(`✅ Ruleset created: ${rulesetName}`);

  // Step 2: Release (deploy) the ruleset to Cloud Firestore
  const releaseUrl = `https://firebaserules.googleapis.com/v1/projects/${PROJECT_ID}/releases`;
  const releaseName = `projects/${PROJECT_ID}/releases/cloud.firestore`;

  // Try PATCH first (update existing release), fall back to POST (create)
  const releaseBody = {
    name: releaseName,
    rulesetName: rulesetName,
  };

  console.log('Deploying ruleset to Cloud Firestore...');
  let releaseRes = await fetch(`${releaseUrl}/${encodeURIComponent('cloud.firestore')}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ release: releaseBody }),
  });

  if (!releaseRes.ok) {
    // Fallback: create a new release
    releaseRes = await fetch(releaseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(releaseBody),
    });
  }

  if (!releaseRes.ok) {
    const errText = await releaseRes.text();
    console.error(`❌ Failed to deploy ruleset: ${releaseRes.status} ${errText}`);
    process.exit(1);
  }

  const release = await releaseRes.json();
  console.log(`✅ Rules deployed successfully!`);
  console.log(`   Release: ${release.name || releaseName}`);
  console.log(`   Ruleset: ${rulesetName}`);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 Firestore security rules are now LIVE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

deployRules().catch((err) => {
  console.error('❌ Deployment failed:', err.message);
  process.exit(1);
});
