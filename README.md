# Retro App

A retrospective application built with React and Next.js.

## Description

Retro App is a simple application that allows two partners to reflect on and discuss a randomly selected question. Each partner can record or type their response, and the app will generate a summary and key themes using OpenAI's API.

## Features

- Random reflection questions
- Voice recording and transcription
- Text analysis with OpenAI
- Summary and key themes extraction

## Tech Stack

- Next.js
- React
- OpenAI API

## Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env.local` file with your OpenAI API key:
   ```
   NEXT_PUBLIC_OPENAI_API_KEY=your-api-key
   ```

## Usage

1. Start the development server:
   ```
   npm run dev
   ```
2. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Migration from Create React App to Next.js

This application was originally built with Create React App and has been migrated to Next.js. The migration involved:

1. Installing Next.js
2. Creating app directory structure
3. Creating page and layout components
4. Moving CSS files
5. Updating environment variables
6. Configuring Next.js

## License

MIT
