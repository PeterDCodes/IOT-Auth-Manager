# 1. Choose the base operating system or runtime environment
FROM node:22-alpine

# 2. Set the working directory inside the container
WORKDIR /src

# 3. Copy your project files from your computer into the container
COPY . .

# 4. Run commands needed to install dependencies or setup the app
RUN npm install

# 5. Tell the container which network port to expose
EXPOSE 3000

# 6. Define the command that starts your application
CMD ["npm", "start"]