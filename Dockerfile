# Stage 1: build the Next.js client into static files
FROM node:22 AS client
WORKDIR /client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: build the C# server
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS server
WORKDIR /src
COPY server/*.csproj ./
RUN dotnet restore
COPY server/ ./
RUN dotnet publish -c Release -o /app

# Stage 3: small final image with only what's needed to run
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=server /app ./
COPY --from=client /client/out ./wwwroot
EXPOSE 8080
ENTRYPOINT ["dotnet", "SyncBoard.dll"]