
## Get started

**OBS settings:**

Open **OBS** then go to settings / stream and paste the following into `Server` and `Stream Key`:

```
rtmp://localhost/live
STREAM_NAME
```

then press **Start Streaming**

---

>**Note:**
>There is 2 options to get rtmp server running, via .bat file (option 1) or manualy in terminals (option 2)

**Option 1:**
Run the 'RunRTMPServer.bat' file to execute all the terminal links from 'Option 2'.  

**Option 2:**
On `rtmp/nms` folder run the following commands:

+ Terminal 1: `npx node-media-server` (I dont think this is necessary any more)
+ Terminal 2: `npx run app.js`
+ Terminal 3: `npx ngrok http 8000`

*Make sure that you logged in **Ngrok** (it uses account login before serving to anyone)*

**Ngrok setup:**

  Make login on ngrok iniciated link and terminal paste the following code but with your authtoken
  ```
  npx ngrok authtoken RwhQEup2658Fbk2U2oe6_3Gbn6UBSDTS7Au8oFYV37
  ```
  (if first time)

---

**See the stream (VLC):**

  Create and paste a stream Ngrok link like the following:
  `<generatedNgrokLink>/live/STREAM_NAME.flv'` to any other device or PC with VLC.

  Once in VLC go to '**Media / Open network stream**' or simply hit (**CTRL+N**) to paste it in the field then press **play**.

  eg: 
    https://62e3-2001-8a0-7fd5-2500-bca1-adff-1f2a-53f7.ngrok.io/live/STREAM_NAME.flv

---

**See the stream (on website):**

  To see it directly on the website, simply go to https://emittersgame.com/rtmp/nms/?tunnel=
  and paste the Ngrok link as '?tunnel' parameter

  eg:
    https://emittersgame.com/rtmp/nms/?tunnel=https://62e3-2001-8a0-7fd5-2500-bca1-adff-1f2a-53f7.ngrok.io
