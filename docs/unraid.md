# Unraid Installation Guide

This guide explains how to install Oscillo on Unraid 7.x using Docker containers.

## 🚀 Quick Installation

### Method 1: User Template (Recommended)

1. **Copy Template File**
   ```bash
   # Copy the template to your Unraid flash drive
   cp unraid/oscillo.xml /boot/config/plugins/dockerMan/templates-user/
   ```

2. **Add Container via Web UI**
   - Navigate to **Docker** tab in Unraid WebUI
   - Click **Add Container**
   - In the **Template** dropdown, select **"Oscillo"**
   - Configure settings (see below)
   - Click **Apply**

### Method 2: Manual Docker Setup

1. **Pull Image**
   ```bash
   docker pull ghcr.io/zachyzissou/interactive-music-3d:latest
   ```

2. **Run Container**
   ```bash
   docker run -d \
     --name=oscillo \
     -p 31415:3000 \
     -v /mnt/user/appdata/oscillo/logs:/app/logs \
     -v /mnt/user/appdata/oscillo/uploads:/app/uploads \
     -e NODE_ENV=production \
     -e LOG_DIR=/app/logs \
     -e TZ=America/New_York \
     --restart unless-stopped \
     ghcr.io/zachyzissou/interactive-music-3d:latest
   ```

## ⚙️ Configuration

### Port Configuration
- **Default Host Port**: `31415`
- **Container Port**: `3000` (fixed)
- **Access URL**: `http://[UNRAID-IP]:31415`

To change the host port, modify the port mapping in the template or docker run command.

### Volume Mappings

| Host Path | Container Path | Purpose |
|-----------|----------------|---------|
| `/mnt/user/appdata/oscillo/logs` | `/app/logs` | Application logs |
| `/mnt/user/appdata/oscillo/uploads` | `/app/uploads` | User exports and uploads |

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Node.js environment |
| `LOG_DIR` | `/app/logs` | Log directory path |
| `NEXT_TELEMETRY_DISABLED` | `1` | Disable Next.js telemetry |
| `TZ` | `America/New_York` | Container timezone |

## 🔧 Advanced Configuration

### Performance Tuning

For optimal performance on Unraid, consider these settings:

1. **CPU Pinning** (optional for high-performance servers)
   - Set CPU affinity to dedicated cores
   - Avoid cores used by Unraid array operations

2. **Memory Allocation**
   - Minimum: 2GB RAM
   - Recommended: 4GB+ RAM for smooth operation
   - Maximum: No limit (application auto-manages)

3. **GPU Acceleration** (if available)
   - NVIDIA: Add `--gpus all` to docker run command
   - AMD: Ensure proper drivers in Unraid

### Network Configuration

The application uses these network features:
- **SharedArrayBuffer**: Requires specific headers (automatically configured)
- **WebGPU**: Modern browser required for best performance
- **WebGL**: Fallback for older hardware

### Storage Considerations

- **Logs**: Typically 10-50MB per day
- **Uploads**: User-dependent, recommend 1GB+ allocation
- **Cache**: Application cache handled internally

## 🛠️ Troubleshooting

### Container Won't Start
```bash
# Check container logs
docker logs oscillo

# Verify image
docker images | grep interactive-music-3d

# Check port conflicts
netstat -tulpn | grep 31415
```

### Application Not Loading
1. **Check browser compatibility**
   - Chrome 113+, Firefox 121+, Safari 18+
   - WebGL 2.0 support required

2. **Network issues**
   - Verify port 31415 is accessible
   - Check Unraid firewall settings
   - Ensure no proxy interference

3. **Resource constraints**
   - Monitor CPU/RAM usage in Unraid
   - Check Docker log for memory errors

### Audio Not Working
1. **Browser permissions** - Click to enable audio
2. **Audio device** - Check system audio output
3. **Browser console** - Look for Web Audio API errors

### Performance Issues
1. **Lower quality settings** in application
2. **Close other containers** using GPU
3. **Check Unraid resource utilization**

## 📊 Monitoring

### Application Health
- **Health Check**: Built-in Docker health check
- **URL**: `http://[UNRAID-IP]:31415/api/health`
- **Logs**: Available in Unraid Docker logs

### Resource Usage
Monitor these metrics in Unraid:
- **CPU**: Should stay under 80% during active use
- **RAM**: Typically 500MB-2GB depending on usage
- **GPU**: Variable based on shader complexity

## 🔒 Security

### Network Security
- Application runs in bridged network mode
- Only exposes port 3000 (mapped to host port)
- No elevated privileges required

### Data Security
- No sensitive data stored permanently
- User uploads only in mapped volumes
- Logs contain no personal information

### Updates
The container automatically pulls the latest stable version. To update:

1. **Via Unraid UI**
   - Go to Docker tab
   - Click update icon for Oscillo container

2. **Manual Update**
   ```bash
   docker pull ghcr.io/zachyzissou/interactive-music-3d:latest
   docker stop oscillo
   docker rm oscillo
   # Recreate with same settings
   ```

## 📞 Support

- **GitHub Issues**: [Report bugs](https://github.com/zachyzissou/INTERACTIVE-MUSIC-3D/issues)
- **Documentation**: [Full docs](https://github.com/zachyzissou/INTERACTIVE-MUSIC-3D)
- **Community**: Unraid forums (search "Oscillo")

## 🏷️ Version Information

- **Latest Stable**: Available via `:latest` tag
- **Version Tags**: Semantic versioning (e.g., `:v1.0.0`)
- **Development**: `:main` branch builds (not recommended for production)

## 📝 Notes

- Container runs as non-root user (nextjs:nodejs)
- Health checks every 30 seconds
- Automatic restart on failure
- Optimized for both desktop and mobile browsers
- PWA installation available through browser