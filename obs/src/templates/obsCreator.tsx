import type { Creator } from "../types";

export const creatorPage = (user: Creator) => {
  return (
    <html>
      <link type="text/css" rel="stylesheet" href="/css/default.css" />
      <link
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
        rel="stylesheet"
        integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH"
        crossorigin="anonymous"
      ></link>
      <body>
        {/* <h1>Tipto OBS Source</h1> */}

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
            <source src="/audio/stinks.mp3" type="audio/mpeg"></source>
          </audio>
        </div>

        {/* <p id="text">Loading Account Watcher</p>
        <p id="txData">Loading Memos</p> */}
        {process.env.NODE_ENV !== "production" ? (
          <button id="test-btn">test tx</button>
        ) : (
          ""
        )}
      </body>
      <script
        src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"
        integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz"
        crossorigin="anonymous"
      ></script>
      <script src="/js/bs58.bundle.js"></script>
      <script src="/js/watcher.js"></script>
    </html>
  );
};
