# SaMs Foodtruck Backend API

This project is a backend API for a food website using Express.js and Sequelize. The API is currently in development and aims to manage food options, customizations, and ingredients for a food truck service.

## Features

- Manage food options and customizations
- Handle ingredient associations
- RESTful API endpoints

## Technologies Used

- Node.js
- Express.js
- Sequelize (ORM)
- PostgreSQL (or any other SQL database supported by Sequelize)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- PostgreSQL (or any other SQL database supported by Sequelize)

### Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/yourusername/sams-foodtruck.git
    cd sams-foodtruck
    ```

2. Install dependencies:
    ```sh
    npm install
    ```

3. Create a `.env` file in the root directory and add your database configuration:
    ```env
    DB_HOST=localhost
    DB_USER=yourusername
    DB_PASS=yourpassword
    DB_NAME=sams_foodtruck
    ```

### Running the Server

Start the development server:
```sh
npm run dev
```

The server will be running at `http://localhost:3000`.

## API Endpoints

Api endpoints are available using swagger at `http://localhost:3000/api-docs`.

## Notes

- This repository is still in development and has not yet been completed.