export const creatorPage = (creator: string) => {
  return (
    <html>
      <link type="text/css" rel="stylesheet" href="/static/css/default.css" />
      <body>
        {/* <h1>Blinch OBS Source</h1> */}

        <div id="obsNotification">
          <h2 id="display"></h2>
          <p id="memo"></p>
          <div id="gif">
            <iframe
              src="https://giphy.com/embed/kIvLVjAulfNTcxUPXU"
              width="240"
              height="240"
              style="border: none; border-radius:35px;"
              class="giphy-embed"
            ></iframe>
            <p>
              <a href="https://giphy.com/gifs/excited-celebrate-yay-kIvLVjAulfNTcxUPXU"></a>
            </p>
          </div>
          <audio id="pingAudio">
            <source src="/static/audio/stinks.mp3" type="audio/mpeg"></source>
          </audio>
        </div>

        {/* <p id="text">Loading Account Watcher</p>
        <p id="txData">Loading Memos</p> */}
      </body>

      <script src="/static/js/bs58.bundle.js"></script>
      <script src="/static/js/watcher.js"></script>
    </html>
  );
};
