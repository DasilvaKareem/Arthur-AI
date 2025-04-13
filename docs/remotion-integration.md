# Remotion Integration for Scene Videos

This document explains how to use the Remotion integration in Arthur to create high-quality MP4 videos from your scenes.

## Overview

The Remotion integration allows you to:

1. Render all shots from a scene into a single cohesive video
2. Add scene titles, transitions, and text overlays
3. Export in high-quality MP4 format
4. Process the rendering in the cloud using AWS Lambda

## Prerequisites

To use the Remotion integration, you need:

1. AWS credentials configured with permissions for Lambda and S3
2. Environment variables set up for Remotion (see below)
3. Generated images for all shots in your scene

## Environment Variables

Add the following variables to your `.env.local` file:

```
REMOTION_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
```

## Usage

1. Open a scene in the project editor
2. Generate images for all shots if you haven't already
3. Click the "Render Scene Video" button (video icon) in the timeline
4. Preview the video in the renderer that appears
5. Click "Export Scene Video" to start the rendering process
6. Wait for rendering to complete and use the "Download" button to save your video

## Customization

The video composition uses the following defaults:
- Resolution: 1920x1080 (Full HD)
- FPS: 30
- Title duration: 2 seconds
- Shot duration: 5 seconds per shot

## Technical Details

The integration uses:
- `@remotion/player` for previewing in the browser
- `@remotion/lambda` for server-side rendering
- AWS S3 for storing the rendered videos

## Troubleshooting

If you encounter issues:

1. Ensure all AWS credentials are set correctly
2. Check that all shots have generated images
3. Look for errors in the browser console or server logs
4. Try regenerating images for problematic shots
5. Ensure your AWS IAM user has sufficient permissions

## Learn More

- [Remotion Documentation](https://www.remotion.dev/docs)
- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/latest/dg/welcome.html)
- [Video Rendering Best Practices](https://www.remotion.dev/docs/video-quality) 