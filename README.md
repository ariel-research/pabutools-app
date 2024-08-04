# pabutools-app
An online app for computing approval based participatory budgeting rules.

## Installation Guide
1. Clone the repository:
   ```
   git clone https://github.com/ariel-research/pabutools-app
   ```
2. Navigate to the project folder:
   ```
   cd pabutools-app
   ```
3. Open the `index.html` file in your browser.
4. If you encounter problems with file loading (which can happen when using WSL), you can:
   1. Install the [Live Preview](https://marketplace.visualstudio.com/items?itemName=ms-vscode.live-server) extension in your VS Code.
   2. Right-click on your `index.html` file and choose `Show Preview`.
   3. Now you can access the app via this URL:
      ```
      http://localhost:3000/pabutools-app/index.html
      ```
   4. For detailed instructions, refer to the link in the first step.

## Production with Nginx
Follow the regular Nginx guide with the following settings:
  
```nginx
  root /path/to/pabutools-app/;
  index index.html;

  location / {
       try_files $uri $uri/ =404;
  }
```
