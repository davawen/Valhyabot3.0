# TunaBot

A simple discord bot written in Typescript with [discordjs](https://discord.js.org/#/) with the goal to play music in voice channels.  
It currently only supports youtube (and youtube music).

## Commands

- `play`
  - `url <url>`: Adds the music at the given youtube URL to the queue
  - `search <query>`: Adds the first result from the given query to the queue
- `skip`: Skips the current playing music and start playing the next music in queue
- `skip_to`: Brings up a menu to choose a music to skip to in the queue
- `stop`: Stops playing music and quit the voice channel
- `remove`: Brings up a menu to remove musics from the queue

## Roadmap

- [x] Youtube source
- [ ] Deezer source
- [ ] Spotify source
- [ ] Some kind of player interface with discord components

## Running

```
git clone https://github.com/davawen/Valhyabot3.0
npm install # or pnpm install, or yarn install
npm run start # or pnpm run start, yarn run start
```
