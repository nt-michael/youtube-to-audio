const express = require('express');
const path = require('path')
const bodyParser = require('body-parser');
const cors = require('cors');
const youtubeAudioStream = require('@isolution/youtube-audio-stream');
require('events').EventEmitter.prototype._maxListeners = 100;

const youtube_data_secret_key = ""; // your Youtube data api key here

const app = express();

const port = 3000;

app.set('view engine', 'pug');

app.use(express.static(path.join(__dirname, 'views/public')));

app.get('/', (req, res) => {
  res.render('main');
});

app.use(cors());

// Configuring body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Module in charge of quering youtube database for videos
app.post('/youtube-videos-search-api/:q', (req, res) => {
    // We will be coding here
    const {google} = require('googleapis');

    // User query data
    const qq = req.params.q;

    // Here we set our youtube data v3 api
    // auth: Youtube secret api
    const youtube = google.youtube({
        version: 'v3',
        auth: youtube_data_secret_key
    });
   
    youtube.search.list({
        part: 'id, snippet',
        q: qq,
        type:'video',
        order:'viewCount',
        maxResults: 6,
        // chart: 'mostPopular',
      }, function (err, data) {
        if (err) {
          console.error('Error: ' + err);
          // Things didn't work out well, let's send an error message
          res.send({
            'error':`Something went wrong, try again or contact me ndemikel@gmail.com ;)`
          });
        }
        if (data) {
          console.log(data.data.items.length);
          var customeResult = [];
          var nextPageToken = data.data.nextPageToken;
          var videos = data.data.items;
          for (i=0; i<data.data.items.length; i++) {               
            var videoId = videos[i].id.videoId;
            var videoTitle = videos[i].snippet.title;
            var videoDesc = videos[i].snippet.description;
            var videoPublishedAt = videos[i].snippet.publishedAt;
            var videoChannel = videos[i].snippet.channelTitle;
            var videoThumbnailUrl = videos[i].snippet.thumbnails.medium.url;
            customeResult.push({
              videoId : videoId,
              videoTitle : videoTitle,
              videoDesc : videoDesc,
              videoPublishedAt : videoPublishedAt,
              videoChannel : videoChannel,
              videoThumbnailUrl : videoThumbnailUrl
            });
          }
          // Everything is good, let's return youtube items to user
          res.json({
            'success':customeResult,
            'nextPageToken':nextPageToken,
            'arrLength':data.data.items.length
          });
        }
      }
    );

});

// Module in charge of quering youtube database for videos
app.post('/page/:token/:q', (req, res) => {
  // We will be coding here
  const {google} = require('googleapis');


  // User query data
  const qq = req.params.q;

  // Here we set our youtube data v3 api
  const youtube = google.youtube({
      version: 'v3',
      auth: youtube_data_secret_key
  });
 
  youtube.search.list({
      part: 'id, snippet',
      q: qq,
      type:'video',
      order:'viewCount',
      maxResults: 6,
      // chart: 'mostPopular',
      pageToken: req.params.token,
    }, function (err, data) {
      if (err) {
        console.error('Error: ' + err);
        // Things didn't work out well, let's send an error message
        res.send({
          'error':`Something went wrong, try again or contact me ndemikel@gmail.com ;)`
        });
      }
      if (data) {
        // console.log(data.data.items);
        const customeResult = [];
        var nextPageToken = data.data.nextPageToken;
        const videos = data.data.items;
        for (i=0; i<data.data.items.length; i++) {               
          var videoId = videos[i].id.videoId;
          var videoTitle = videos[i].snippet.title;
          var videoDesc = videos[i].snippet.description;
          var videoPublishedAt = videos[i].snippet.publishedAt;
          var videoChannel = videos[i].snippet.channelTitle;
          var videoThumbnailUrl = videos[i].snippet.thumbnails.medium.url;

          customeResult.push({
            videoId : videoId,
            videoTitle : videoTitle,
            videoDesc : videoDesc,
            videoPublishedAt : videoPublishedAt,
            videoChannel : videoChannel,
            videoThumbnailUrl : videoThumbnailUrl
          });
        }
        // Everything is good, let's return youtube items to user
        res.json({
          'success': customeResult,
          'nextPageToken':nextPageToken,
          'arrLength':data.data.items.length
        });
      }
    }
  );

});

// Module in charge of playing audio from selected video, we using a library from our friends at MIT ;)
app.get('/:videoId', (req, res) => {
  const requestUrl = `https://youtube.com/watch?v=${req.params.videoId}`;
  const streamPromise = youtubeAudioStream(requestUrl);
  streamPromise
    .then(stream => {
      stream.emitter.on('error', err => {
        console.log(err);
      });
      stream.pipe(res);
    })
    .catch(err => {
      console.log(err);
    });
});

app.listen(port, () => {
  console.log(`Listening on port ${port}...`);
});