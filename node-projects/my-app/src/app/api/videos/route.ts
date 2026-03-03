import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  const dirPath = path.join(process.cwd(), 'public');
  fs.readdir(dirPath, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to read directory' });
    }
    const videos = files.filter(file => file.endsWith('.mp4'));
    res.status(200).json(videos);
  });
}