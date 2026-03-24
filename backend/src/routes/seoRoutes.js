import express from 'express';
import Address from '../models/Address.js';
import City from '../models/City.js';

const router = express.Router();

// Helper to determine if the requester is a bot/crawler
const isBot = (userAgent = '') => {
  const bots = [
    'googlebot', 'whatsapp', 'facebookexternalhit', 'twitterbot', 
    'bingbot', 'baiduspider', 'skypeuri', 'telegrambot'
  ];
  return bots.some(bot => userAgent.toLowerCase().includes(bot));
};

// PPOINNT Landing Page SEO & Preview
router.get('/p/:code', async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    const address = await Address.findByCode(code);
    
    if (!address) {
      return res.status(404).redirect(`${process.env.FRONTEND_URL || 'http://localhost:5183'}/404`);
    }

    const userAgent = req.headers['user-agent'] || '';
    const locationStr = `${address.city || ''}, ${address.state || ''}`.trim().replace(/^,|,$/g, '');
    const title = `PPOINNT - ${address.place_type || 'Location'} in ${locationStr}`;
    const description = `Navigate easily to this location using PPOINNT code: ${address.code}. ${address.landmark || ''}`;
    const imageUrl = `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/pin-s-l+fbba00(${address.longitude},${address.latitude})/${address.longitude},${address.latitude},15,0/600x300?access_token=${process.env.MAPBOX_ACCESS_TOKEN}`;
    const url = `${process.env.FRONTEND_URL || 'http://ppoint.africa'}/p/${address.code}`;

    // If it's a bot, serve minimal HTML with meta tags
    if (isBot(userAgent)) {
      return res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${title}</title>
            <meta name="description" content="${description}">
            <meta property="og:title" content="${title}">
            <meta property="og:description" content="${description}">
            <meta property="og:image" content="${imageUrl}">
            <meta property="og:url" content="${url}">
            <meta property="og:type" content="website">
            <meta name="twitter:card" content="summary_large_image">
            <meta name="twitter:title" content="${title}">
            <meta name="twitter:description" content="${description}">
            <meta name="twitter:image" content="${imageUrl}">
          </head>
          <body>
            <h1>${title}</h1>
            <p>${description}</p>
            <script>window.location.href = "${url}";</script>
          </body>
        </html>
      `);
    }

    // If it's a real user, redirect to the frontend route
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5183'}/p/${address.code}`);
  } catch (error) {
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5183'}/`);
  }
});

// Dynamic Sitemap Generator
router.get('/sitemap.xml', async (req, res) => {
  try {
    const addresses = await Address.list(''); // Get all addresses
    const baseUrl = process.env.FRONTEND_URL || 'https://ppoint.africa';
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    
    // Static Pages
    xml += `  <url><loc>${baseUrl}/</loc><priority>1.0</priority></url>\n`;
    xml += `  <url><loc>${baseUrl}/agents</loc><priority>0.8</priority></url>\n`;
    xml += `  <url><loc>${baseUrl}/developers</loc><priority>0.8</priority></url>\n`;
    
    // Dynamic PPOINNT Pages
    addresses.forEach(addr => {
      xml += `  <url><loc>${baseUrl}/p/${addr.ppoint_code || addr.code}</loc><priority>0.6</priority></url>\n`;
    });
    
    xml += `</urlset>`;
    
    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    res.status(500).send('Error generating sitemap');
  }
});

export default router;
