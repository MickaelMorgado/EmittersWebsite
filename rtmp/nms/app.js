/*
  HOW TO USE:

  OBS settings got to stream:

    rtmp://localhost/live
    STREAM_NAME

  On rtmp/nms folder run:

  - terminal 1: npx node-media-server (I dont think this is necessary any more)
  - terminal 2: npx run app.js
  - terminal 3: npx ngrok http 8000

  See the stream:
  
  copy stream ngrok link+/live/STREAM_NAME.flv to any other device with VLC in Media/Open network stream (CTRL+N) paste it and hit play

  eg: https://cf1c-2001-8a0-7fd5-2500-9de3-dd5f-9d4-d588.eu.ngrok.io/live/STREAM_NAME.flv

*/

const NodeMediaServer = require('node-media-server');

const config = {
  rtmp: {
    port: 1935,
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60
  },
  http: {
    port: 8000,
    allow_origin: '*'
  }
};

var nms = new NodeMediaServer(config)
nms.run();