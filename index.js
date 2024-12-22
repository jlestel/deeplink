const express = require('express');
const UAParser = require('ua-parser-js');
const app = express();

// Middleware for user-agent detection
const userAgentMiddleware = (req, res, next) => {
  const parser = new UAParser();
  const userAgent = req.get('User-Agent') || '';
  const result = parser.setUA(userAgent).getResult();

  req.userAgentInfo = {
    isDesktop: result.device.type === undefined, // Desktop has no specific type in UAParser
    browser: result.browser.name,
    os: result.os.name
  };

  next();
};

// Function to validate a URL
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (err) {
    return false;
  }
};

// Function to determine the appropriate native protocol
const getNativeProtocol = (url, os) => {
  const domain = new URL(url).hostname;
  if (domain.endsWith('youtube.com')) return 'vnd.youtube';
  if (domain.endsWith('linkedin.com')) return 'linkedin';
  if (domain.endsWith('spotify.com')) return 'spotify';
  if (domain.endsWith('leclercdrive.fr')) return 'leclercdrive';
  if (domain.endsWith('e.leclerc')) return 'leclerc';

  // Use specific protocols for Safari (iOS/macOS) and Chrome (Android)
  if (os === 'iOS' || os === 'Mac OS') return 'safari-https';
  if (os === 'Android') return 'googlechrome';

  return 'https'; // Default to HTTPS for unsupported domains
};

app.use(userAgentMiddleware);

app.get('/', (req, res) => {
  const urlParam = req.query.url;
  const debug = req.query.debug;
  const comment = debug ? '//' : '';
  if (!urlParam) {
    return res.status(200).send('Missing "url" parameter.');
  }

  if (!isValidUrl(urlParam)) {
    return res.status(400).send('Invalid "url" parameter. Please provide a valid URL.');
  }

  const { isDesktop, os } = req.userAgentInfo;
  const nativeProtocol = getNativeProtocol(urlParam, os);
  const protocol = isDesktop ? 'https' : nativeProtocol;
  const redirectUrl = `${protocol}://${urlParam.replace('https://', '').replace('http://', '')}`;

  res.send(`<!DOCTYPE html>
<html>
  <head>
    <script>
      setTimeout(function() {
        ${comment}window.location.href = "https://${urlParam}";
      }, 2000);

      ${comment}window.location.href = "${redirectUrl}";
    </script>
  </head>
  <body>${redirectUrl} - ${os}</body>
</html>`);
});

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
