const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); // <-- Add this
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors()); // <-- Enable CORS for all origins
app.use(bodyParser.json());

// Serve raw DICOM files so the viewer (OpenDicom.tsx) can fetch them
// Place your .dcm files under ./Dicom   (e.g. Dicom/0002213.dcm)
app.use('/Dicom', express.static(path.join(__dirname, 'Dicom')));

app.post('/open-dicom', (req, res) => {
  console.log('Received request to open DICOM file');
  console.debug('Request body:', req.body);
  const { url } = req.body || {};
  if (!url) {
    return res.status(400).json({ error: 'Missing "url" in JSON body' });
  }

  const redirectTo = `/viewer/open?dicomUrl=${encodeURIComponent(url)}`;
  return res.redirect(302, redirectTo);
});

app.use(express.static(path.join(__dirname, 'platform', 'app', 'dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'platform', 'app', 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Express server listening on http://localhost:${PORT}`);
});
