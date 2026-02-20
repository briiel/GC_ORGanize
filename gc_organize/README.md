# GcOrganize

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.1.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Deployment (Apache/XAMPP)

If you see console errors like `Failed to load module script ... MIME type of "text/html"`, your server is returning `index.html` for missing JS chunks.

- Build with the correct app base path for your deployed URL:
	- Root domain: `ng build --configuration production --base-href /`
	- Subfolder (example): `ng build --configuration production --base-href /capstone/`
- For Angular 19 app builder, deploy the static app from `dist/gc_organize/browser/`.
- This project now ships a production `.htaccess` from `public/.htaccess` to:
	- avoid rewriting asset requests (`.js`, `.css`, etc.) to `index.html`
	- keep `index.html`/service-worker files uncached
	- cache hashed static assets safely
- After deploying a new version, hard-refresh and clear old service worker/cache for the site.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
