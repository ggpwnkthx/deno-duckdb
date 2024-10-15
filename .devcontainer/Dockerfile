# Stage 1: Get Deno binary
FROM denoland/deno:bin AS deno

# Stage 2: Main development environment
FROM mcr.microsoft.com/devcontainers/typescript-node:20

# Copy Deno binary from Stage 1
COPY --from=deno /deno /usr/local/bin/deno

# Update package list, install clang, and clean up
RUN apt-get update && \
    apt-get install -y --no-install-recommends clang && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*