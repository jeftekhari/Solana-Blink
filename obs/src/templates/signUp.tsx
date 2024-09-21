import type { Creator } from "../types";

export const signupPage = () => {
  return (
    <html>
      <head>
        <title>Sign Up - Streamor</title>
        <link rel="stylesheet" href="/css/default.css" />
        <link rel="stylesheet" href="/css/donatePage.css" />
        <link rel="stylesheet" href="/css/signup.css" />
      </head>
      <body>
        <div class="signup-container">
          <div class="signup-form">
            <h1>Sign Up for Streamor</h1>
            <form id="signupForm" action="/signup" method="POST">
              <div class="form-group">
                <label for="name">Name:</label>
                <input type="text" id="name" name="name" required="true" />
              </div>
              <div class="form-group">
                <label for="twitter">Twitter Handle:</label>
                <input
                  type="text"
                  id="twitter"
                  name="twitter"
                  required="true"
                />
              </div>
              <div class="form-group">
                <label for="icon">Icon URL:</label>
                <input type="text" id="icon" name="icon" required="true" />
              </div>
              <div class="form-group">
                <label for="description">Description:</label>
                <textarea
                  id="description"
                  name="description"
                  required="true"
                ></textarea>
              </div>
              <div class="form-group">
                <label for="walletAddress">Wallet Address:</label>
                <input
                  type="text"
                  id="walletAddress"
                  name="walletAddress"
                  required="true"
                />
              </div>
              <button type="submit" class="button">
                Sign Up
              </button>
            </form>
          </div>
        </div>
      </body>
    </html>
  );
};
