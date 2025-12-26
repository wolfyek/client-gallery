# Client Photography Gallery

A private, password-protected client gallery application built with Next.js, tailored to a premium minimalist aesthetic.

## features

- **Private Client Links**: `/gallery/[client-slug]`
- **Password Protection**: Secure-feeling lock screen before viewing photos.
- **Premium Design**: Dark mode (`#121212`), "Big Shoulders Display" typography, and smooth animations.
- **Masonry Grid**: Responsive layout for showcasing photography.

## Prerequisites

**Node.js is required.**
Please install Node.js from [nodejs.org](https://nodejs.org/) (LTS Version recommended).

## Getting Started

1.  **Install Dependencies**:
    Open the terminal in this directory and run:
    ```bash
    npm install
    ```

2.  **Run the Development Server**:
    ```bash
    npm run dev
    ```

3.  **Open the App**:
    Visit [http://localhost:3000](http://localhost:3000) in your browser.

## Customization

- **Add Clients**: Edit `lib/data.ts` to add new client galleries and set their passwords.
- **Change Images**: Update the photo URLs in `lib/data.ts`.
