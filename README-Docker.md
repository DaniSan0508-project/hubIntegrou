# HubIntegrou - Docker Setup

This project includes Docker configuration to make it easier to set up the development environment.

## Prerequisites

- Docker Engine installed on your system
- Docker Compose installed

## Running the Application

To start the application using Docker, run:

```bash
docker-compose up
```

The application will be available at `http://localhost:5173`

## Building the Docker Image

If you need to rebuild the Docker image, use:

```bash
docker-compose build
```

## Stopping the Application

To stop the application, press `Ctrl+C` in the terminal where it's running, or run:

```bash
docker-compose down
```

## Development Notes

- The source code is mounted as a volume, so changes to the code will be reflected in the running container
- The container exposes port 5173, which is the default Vite development server port
- Dependencies are installed in the container, not on your local machine

## Troubleshooting

If you encounter any issues:

1. Make sure Docker is running
2. Try rebuilding the image: `docker-compose build --no-cache`
3. Check that no other process is using port 5173