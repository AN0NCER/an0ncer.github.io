self.addEventListener('install', async event => {
    console.log("[SW]: Install");
  });
  self.addEventListener('activate', async event => {
    console.log("[SW]: Activate");
  });