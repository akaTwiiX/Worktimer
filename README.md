# Worktimer

Worktimer is a modern web app for tracking and managing working hours. It provides a simple overview of all hours worked and breaks taken via an interactive calendar.

## Features

- **Time Tracking**: Record your working hours on specific days using an interactive monthly calendar (add, edit, delete).
- **Automatic Calculation**: Total working time and total breaks per month are calculated automatically and efficiently in the background.
- **Categories & Colors**: Personalize your entries with custom colors and labels (e.g., for illness, vacation, home office).
- **Cloud Synchronization**: With Firebase integration (Authentication & Firestore), your data is secure and synchronized in real-time across multiple devices.
- **Responsive & Mobile-ready**: The app supports touch gestures (e.g., swiping to change months) and adapts to your device.
- **Theme Support**: Ability to use different color schemes and themes.

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.3.15.

## Prerequisites

- NodeJS 22
- [pnpm](https://pnpm.io/installation#using-other-package-managers)

## Setup Environment

1. Create the local development environment file:

    ```bash
    cd ./src/environments
    cp environment.ts environment.dev.ts
    cd ../..
    ```

2. Make sure you install the dependencies:

    ```bash
    pnpm install
    ```

## Available Scripts

In the project directory, you can run the following commands (using `pnpm` as required):

### `pnpm start`
Starts the local development server.
Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

### `pnpm run watch`
Builds the project in development mode and watches for file changes.

### `pnpm build`
Builds the project for development. The build artifacts will be stored in the `dist/` directory.

### `pnpm run build:prod`
Builds the application for production to the `dist/` directory. 
This script also runs prebuild and postbuild steps automatically:
- **Prebuild**: Configures the environment running `node ./scripts/set-env.js`.
- **Build**: Compiles with production configuration and base href for `/Worktimer/`.
- **Postbuild**: Generates a 404 page running `node ./scripts/generate-404.js`.

### `pnpm test`
Executes the unit tests via [Karma](https://karma-runner.github.io).

## Code Scaffolding

Run `pnpm ng generate component component-name` to generate a new component. You can also use `pnpm ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Further Help

To get more help on the Angular CLI use `pnpm ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
