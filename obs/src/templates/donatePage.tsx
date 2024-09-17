import type { Creator } from "../types";

export const tags = (user: Creator) => {
  return (
    <html>
      <head>
        <title>{`Tip ${user.name}`}</title>
        <meta name="og:title" content={`Blink ${user.name}`} />
        <meta name="og:description" content={user.description} />
        <meta name="og:url" content="https://blink.fren.tools/" />
        <meta name="og:site_name" content="FrenTools" />
        <meta name="og:type" content="website" />
        <meta
          name="og:image"
          content={`https://blink.fren.tools/static/img/${user.icon}`}
        />
        <meta name="og:image:width" content="1200" />
        <meta name="og:image:height" content="630" />
        <meta name="og:locale" content="en_US" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content={`@${user.twitter}`} />
        <meta name="twitter:title" content={`${user.name} Blink`} />
        <meta name="twitter:description" content={user.description} />
        <meta
          name="twitter:image"
          content={`https://blink.fren.tools/static/img/${user.icon}`}
        />
        <link rel="stylesheet" href="/static/css/donatePage.css" />
      </head>
      <body>
        <div class="container">
          <header>
            <img
              src={`/static/img/${user.icon}`}
              alt={`${user.name}'s avatar`}
            />
            <h1>{user.name}</h1>
            <p>{user.description}</p>
          </header>
          
          <main>
            <div class="card">
              <h2>About Me</h2>
              <p>{user.description}</p>
            </div>
            
            <div class="card">
              <h2>Support Me</h2>
              <p>If you enjoy my content, consider supporting me:</p>
              <ul>
                <li>
                  <a href="">
                    [DONATE]
                  </a>
                </li>
                <li>
                  <a href={`https://twitter.com/${user.twitter}`}>
                    [FOLLOW ON TWITTER]
                  </a>
                </li>
              </ul>
            </div>
          </main>
          <footer>
            <p>&copy; {new Date().getFullYear()} {user.name} | Last updated: {new Date().toLocaleDateString()}</p>
          </footer>
        </div>
      </body>
    </html>
  );
};
