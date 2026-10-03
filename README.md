# KrishiDhan App

Mobile-first agricultural marketplace to rent or sell equipment.

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create env file from example:

```bash
cp .env.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

3. Fill all Firebase + Cloudinary values in `.env.local`.

4. Start app:

```bash
npm run dev
```

## Required Environment Variables

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID

VITE_CLOUDINARY_CLOUD_NAME
VITE_CLOUDINARY_UPLOAD_PRESET
VITE_CLOUDINARY_UPLOAD_FOLDER
```

## Common Errors

### 1) `Missing Firebase env config`

Cause: `.env.local` missing or incomplete.

Fix: Create `.env.local` from `.env.example` and fill all values.

### 2) Profile page shows load error

Cause: logged-in Firebase user does not have a matching Firestore document in `users/{uid}`.

Fix: Register user through app flow, or create Firestore user document with:

```json
{
  "uid": "user_uid",
  "name": "User Name",
  "phone": "9876543210",
  "city": "Kolhapur",
  "photoURL": "",
  "role": "farmer"
}
```

## Build

```bash
npm run build
```
