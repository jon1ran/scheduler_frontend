# Deploying to Dokploy

This guide walks you through deploying your React + Vite frontend to Dokploy using Nixpacks.

## Prerequisites

1. **Dokploy Instance**: You need access to a Dokploy instance (self-hosted or cloud)
2. **Git Repository**: Your code should be in a Git repository (GitHub, GitLab, Gitea, etc.)
3. **Environment Variables**: Have your production Clerk publishable key ready

## Deployment Steps

### 1. Push Your Code to Git

Ensure all your changes are committed and pushed to your Git repository:

```bash
git add .
git commit -m "Add Nixpacks deployment configuration"
git push origin main
```

### 2. Create a New Application in Dokploy

1. Log in to your Dokploy dashboard
2. Click **"Create Application"** or **"New Project"**
3. Select **"Git Repository"** as the source
4. Connect your Git repository:
   - Enter your repository URL
   - Select the branch (e.g., `main` or `master`)
   - Authenticate if required

### 3. Configure Build Settings

Dokploy will automatically detect your Node.js/Vite project and select **Nixpacks** as the build provider.

**Build Configuration** (auto-detected):
- **Build Command**: `npm run build`
- **Start Command**: `npm run start`
- **Install Command**: `npm install`

> [!NOTE]
> Nixpacks automatically detects these from your `package.json`. No manual configuration needed!

### 4. Set Environment Variables

In the Dokploy application settings, add your environment variables:

| Variable Name | Value | Description |
|--------------|-------|-------------|
| `VITE_CLERK_PUBLISHABLE_KEY` | `pk_live_...` or `pk_test_...` | Your Clerk publishable key (production or test) |

> [!IMPORTANT]
> Make sure to use the **production** Clerk key if deploying to production, not the test key from your `.env` file.

### 5. Configure Port (Optional)

The application will run on port **3000** by default (as specified in the `start` script).

If Dokploy requires a different port, you can:
- Update the `start` script in `package.json`: `"start": "npx serve -s dist -l <PORT>"`
- Or set a `PORT` environment variable in Dokploy

### 6. Deploy

1. Click **"Deploy"** in Dokploy
2. Monitor the build logs to ensure:
   - Dependencies install successfully
   - Build completes without errors
   - Application starts on the correct port

### 7. Verify Deployment

Once deployed, Dokploy will provide you with a URL (e.g., `https://your-app.dokploy.app`).

**Test the following**:
- ✅ Application loads correctly
- ✅ All routes work (React Router navigation)
- ✅ Clerk authentication flow works
- ✅ Static assets load properly

## Troubleshooting

### Build Fails

- Check the build logs in Dokploy
- Ensure all dependencies are listed in `package.json`
- Verify Node.js version compatibility

### Application Won't Start

- Verify the `start` script in `package.json` is correct
- Check that the port (3000) is not already in use
- Review application logs in Dokploy

### Clerk Authentication Issues

- Verify `VITE_CLERK_PUBLISHABLE_KEY` is set correctly in Dokploy
- Ensure you're using the correct key (test vs. production)
- Check Clerk dashboard for allowed domains/origins

### Routes Return 404

The `serve` package automatically handles SPA routing, but if you encounter issues:
- Verify the build output is in the `dist` directory
- Check that `serve` is serving with the `-s` (single-page app) flag

## Custom Nixpacks Configuration (Optional)

If you need more control over the build process, create a `nixpacks.toml` file:

```toml
[phases.setup]
nixPkgs = ["nodejs_20"]

[phases.install]
cmds = ["npm ci"]

[phases.build]
cmds = ["npm run build"]

[start]
cmd = "npm run start"
```

This allows you to:
- Pin specific Node.js versions
- Use `npm ci` instead of `npm install`
- Add custom build steps
- Configure environment-specific settings

## Updating Your Deployment

To deploy updates:

1. Make your changes locally
2. Commit and push to Git
3. Dokploy will automatically rebuild and redeploy (if auto-deploy is enabled)
4. Or manually trigger a deployment in the Dokploy dashboard

---

**Need Help?** Check the [Dokploy Documentation](https://docs.dokploy.com) or [Nixpacks Documentation](https://nixpacks.com/docs).
