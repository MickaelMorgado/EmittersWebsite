This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Build project for Cpanel upload

```sh
cd D:\EmittersWebsite\EmittersWebsite\node-projects\my-app
npm run build
```

## Cpanel Upload built

- go to dist folder 
- compress content (zip)
- upload it to your Cpanel (as Cpanel upload has limitations) in public_html/node-projects/my-app/dist 

## Testing the Vite Setup - Step by Step Guide

1. **Install dependencies**  
   Open a terminal in the `node-projects/my-app` directory and run:  
   ```sh
   npm install
   ```

2. **Start development server**  
   Run the development server with hot reload:  
   ```sh
   npm run dev
   ```  
   This will open your app at [http://localhost:5173](http://localhost:5173) by default.

3. **Build production bundle**  
   When ready to create a production build, run:  
   ```sh
   npm run build
   ```  
   This will generate an optimized static build in the `dist` directory.

4. **Preview production build locally**  
   To preview the production build on a local server, run:  
   ```sh
   npm run preview
   ```  
   This serves the `dist` directory so you can verify the production build.

5. **Serve production build on any static server**  
   You can serve the `dist` directory using any static file server, for example:  
   ```sh
   npx serve dist
   ```  
   or any other static file server of your choice.

This setup allows you to develop and deploy your React app as a fully static site using Vite.
