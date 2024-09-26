import type { Creator } from "../types";
import { Navbar } from '../components/navbar';

export const signupPage = () => {
  return (
    <html>
      <head>
        <title>Sign Up - Tipto</title>
        <link rel="stylesheet" href="/css/default.css" />
        <link rel="stylesheet" href="/css/donatePage.css" />
        <link rel="stylesheet" href="/css/signUp.css" />
      </head>
      <body>
        <nav class="navbar">
          <div class="navbar-left">
            <a href="/" class="navbar-button">Home</a>
          </div>
          <div class="navbar-right">
            <a href="#" class="navbar-button">Login</a>
          </div>
        </nav>
        <div class="signup-container">
          <div class="signup-form">
            <h1>Sign Up for Tipto</h1>
            <div class="oauth-buttons">
              <a href="/auth/google" class="login-button gmail-button">
                <img src="https://upload.wikimedia.org/wikipedia/commons/4/4e/Gmail_Icon.png" alt="Gmail Logo" width="20" height="20"/>
                Sign in with Google
              </a>              
              <a href="/auth/twitch" class="login-button twitch-button">
                <img src="https://upload.wikimedia.org/wikipedia/commons/a/af/Twitch_Logo_2019.png" alt="Twitch Logo" width="20" height="20"/>
                Sign in with Twitch
              </a>              
            </div>
            <button class="button" onclick="window.location.href='/auth/email'">Sign up with other email</button>
          </div>
        </div>
      </body>
    </html>
  );
};
