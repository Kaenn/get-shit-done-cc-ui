#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ora = require('ora');
const supportsColor = require('supports-color');

const VERSION = require('../package.json').version;
const GITHUB_REPO = 'glennin-codes/get-shit-done-cc-ui';

/**
 * Detect platform and return binary name
 * @returns {string} Binary name (e.g., 'gsd-ui-web-linux-x64', 'gsd-ui-web.exe')
 */
function detectPlatform() {
  // Allow manual override via environment variable
  const override = process.env.GSD_UI_PLATFORM;
  if (override) {
    return getPlatformBinaryName(override);
  }

  let platform = process.platform;
  let arch = process.arch;

  // WSL detection - check if running on Windows but with Linux kernel
  if (platform === 'linux' && fs.existsSync('/proc/version')) {
    const procVersion = fs.readFileSync('/proc/version', 'utf8').toLowerCase();
    if (procVersion.includes('microsoft') || procVersion.includes('wsl')) {
      // WSL detected, use Linux binary
      platform = 'linux';
    }
  }

  // Check if running on Windows but actually WSL (alternate detection)
  if (platform === 'win32' && process.env.WSL_DISTRO_NAME) {
    platform = 'linux';
  }

  const platformKey = `${platform}-${arch}`;
  return getPlatformBinaryName(platformKey);
}

/**
 * Map platform key to binary name
 * @param {string} platformKey Platform identifier (e.g., 'linux-x64', 'darwin-arm64')
 * @returns {string} Binary name
 */
function getPlatformBinaryName(platformKey) {
  const mapping = {
    'linux-x64': 'gsd-ui-web-linux-x64',
    'darwin-x64': 'gsd-ui-web-darwin-x64',
    'darwin-arm64': 'gsd-ui-web-darwin-arm64',
    'win32-x64': 'gsd-ui-web.exe',
  };

  const binaryName = mapping[platformKey];

  if (!binaryName) {
    const supportsColorStderr = supportsColor.stderr;
    const red = supportsColorStderr && !process.env.NO_COLOR ? '\x1b[31m' : '';
    const reset = supportsColorStderr && !process.env.NO_COLOR ? '\x1b[0m' : '';

    console.error(`${red}Error: Unsupported platform: ${platformKey}${reset}`);
    console.error('');
    console.error('Supported platforms:');
    console.error('  - linux-x64');
    console.error('  - darwin-x64 (macOS Intel)');
    console.error('  - darwin-arm64 (macOS Apple Silicon)');
    console.error('  - win32-x64');
    console.error('');
    console.error('To build from source, visit:');
    console.error('https://github.com/glennin-codes/get-shit-done-cc-ui#building-from-source');
    process.exit(1);
  }

  return binaryName;
}

/**
 * Download file from URL with progress
 * @param {string} url URL to download from
 * @param {string} destPath Destination file path
 * @param {ora.Ora} spinner Spinner instance for progress updates
 * @returns {Promise<void>}
 */
function downloadFile(url, destPath, spinner) {
  return new Promise((resolve, reject) => {
    https.get(url, { followRedirect: true }, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        return downloadFile(response.headers.location, destPath, spinner)
          .then(resolve)
          .catch(reject);
      }

      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        return;
      }

      const totalSize = parseInt(response.headers['content-length'], 10);
      let downloadedSize = 0;

      const file = fs.createWriteStream(destPath);

      response.on('data', (chunk) => {
        downloadedSize += chunk.length;
        if (totalSize) {
          const progress = ((downloadedSize / totalSize) * 100).toFixed(1);
          const downloadedMB = (downloadedSize / 1024 / 1024).toFixed(1);
          const totalMB = (totalSize / 1024 / 1024).toFixed(1);
          spinner.text = `Downloading... ${downloadedMB}MB/${totalMB}MB (${progress}%)`;
        }
      });

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        resolve();
      });

      file.on('error', (err) => {
        fs.unlink(destPath, () => {}); // Clean up partial download
        reject(err);
      });
    }).on('error', reject);
  });
}

/**
 * Verify file checksum
 * @param {string} filePath Path to file to verify
 * @param {string} expectedChecksum Expected SHA256 checksum
 * @returns {Promise<boolean>}
 */
async function verifyChecksum(filePath, expectedChecksum) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);

    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => {
      const actualChecksum = hash.digest('hex');

      // Use timing-safe comparison to prevent timing attacks
      const expected = Buffer.from(expectedChecksum, 'hex');
      const actual = Buffer.from(actualChecksum, 'hex');

      if (expected.length !== actual.length) {
        resolve(false);
        return;
      }

      try {
        const isValid = crypto.timingSafeEqual(expected, actual);
        resolve(isValid);
      } catch (err) {
        reject(err);
      }
    });
    stream.on('error', reject);
  });
}

/**
 * Download and verify binary
 * @returns {Promise<boolean>} True on success
 */
async function downloadBinary() {
  const supportsColorStdout = supportsColor.stdout;
  const supportsColorStderr = supportsColor.stderr;
  const hasColor = supportsColorStdout && !process.env.NO_COLOR;
  const red = supportsColorStderr && !process.env.NO_COLOR ? '\x1b[31m' : '';
  const yellow = supportsColorStderr && !process.env.NO_COLOR ? '\x1b[33m' : '';
  const reset = supportsColorStderr && !process.env.NO_COLOR ? '\x1b[0m' : '';

  const binaryName = detectPlatform();
  const isWindows = binaryName.endsWith('.exe');
  const outputName = isWindows ? 'gsd-ui-web.exe' : 'gsd-ui-web';

  const binDir = path.join(__dirname, '..', 'bin');
  const binaryPath = path.join(binDir, outputName);

  // Ensure bin directory exists
  if (!fs.existsSync(binDir)) {
    fs.mkdirSync(binDir, { recursive: true });
  }

  const binaryUrl = `https://github.com/${GITHUB_REPO}/releases/download/v${VERSION}/${binaryName}`;
  const checksumUrl = `${binaryUrl}.sha256`;

  const spinner = ora({
    text: 'Downloading binary...',
    color: hasColor ? 'cyan' : undefined,
    spinner: 'dots',
  }).start();

  try {
    // Download checksum file first
    spinner.text = 'Downloading checksum...';
    const checksumPath = path.join(binDir, `${outputName}.sha256`);
    await downloadFile(checksumUrl, checksumPath, spinner);
    const expectedChecksum = fs.readFileSync(checksumPath, 'utf8').trim().split(/\s+/)[0];

    // Download binary
    spinner.text = 'Downloading binary...';
    await downloadFile(binaryUrl, binaryPath, spinner);

    // Verify checksum
    spinner.text = 'Verifying checksum...';
    const isValid = await verifyChecksum(binaryPath, expectedChecksum);

    if (!isValid) {
      spinner.fail('Checksum verification failed');
      console.error(`${red}Error: Downloaded binary checksum does not match expected value.${reset}`);
      console.error('This could indicate a corrupted download or security issue.');
      console.error('');
      console.error('Retry: npx get-shit-done-cc-ui');
      fs.unlinkSync(binaryPath); // Remove invalid binary
      fs.unlinkSync(checksumPath); // Remove checksum file
      process.exit(1);
    }

    // Set executable permissions on Unix
    if (!isWindows) {
      fs.chmodSync(binaryPath, 0o755);
    }

    // Clean up checksum file
    fs.unlinkSync(checksumPath);

    spinner.succeed('Binary downloaded and verified successfully!');
    return true;

  } catch (error) {
    spinner.fail('Download failed');
    console.error('');
    console.error(`${red}Error: ${error.message}${reset}`);
    console.error('');
    console.error('Check your internet connection and retry:');
    console.error('  npx get-shit-done-cc-ui');

    // Clean up any partial downloads
    if (fs.existsSync(binaryPath)) {
      fs.unlinkSync(binaryPath);
    }
    const checksumPath = path.join(binDir, `${outputName}.sha256`);
    if (fs.existsSync(checksumPath)) {
      fs.unlinkSync(checksumPath);
    }

    process.exit(1);
  }
}

// Allow running directly for testing
if (require.main === module) {
  if (process.argv.includes('--test-platform')) {
    console.log(`Detected platform: ${detectPlatform()}`);
    process.exit(0);
  }

  downloadBinary().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { downloadBinary };
