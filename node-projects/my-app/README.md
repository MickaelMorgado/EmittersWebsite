# My App

This is a Next.js application configured for deployment on Vercel.

## Node.js Version Requirements

This project requires **Node.js 20.x** for compatibility with Vercel's deployment environment and React Three Fiber library compatibility. The `@react-three/fiber` and related Three.js libraries haven't been updated to support newer Node.js releases.

### Local Development Setup

1. **Using nvm (recommended):**
   ```bash
   nvm install 20
   nvm use 20
   ```

2. **Verify Node.js version:**
   ```bash
   node --version
   # Should output v20.x.x
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

### Engine Configuration

The `engines` field in `package.json` specifies Node.js 20.x:

```json
{
  "engines": {
    "node": "20.x"
  }
}
```

This ensures consistent Node.js versions between local development and Vercel's production environment.

## Vercel Deployment

### Setup

1. Ensure you have the environment variables set up in Vercel dashboard or locally in a `.env` file. Example variables are listed in `.env.example`.

2. The project includes a `vercel.json` file to configure the build and routing for Vercel.

### Scripts

- `npm run vercel-build`: Builds the project for Vercel deployment.
- `npm run dev`: Runs the development server.
- `npm run build`: Builds the project.
- `npm run start`: Starts the production server.

### Deployment

To deploy the project to Vercel:

1. Install the Vercel CLI if you haven't already:

   ```bash
   npm install -g vercel
   ```

2. Run the build command locally to verify:

   ```bash
   npm run vercel-build
   ```

3. Deploy using the Vercel CLI:

   ```bash
   vercel --prod
   ```

Alternatively, connect your GitHub repository to Vercel for automatic deployments.

## Notes

- Make sure to add any required environment variables in the Vercel dashboard under your project settings.
- The `.env.example` file provides a template for local development environment variables.
