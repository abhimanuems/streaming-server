import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import { spawn } from "child_process";
import { Server } from "socket.io";
import { fileURLToPath } from "url";
import http from "http";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });
import verifyToken from "../src/middileware/auth.js";
import {
  youtubeSettings,
  facebookSettings,
  inputSettings,
} from "./services/ffmpeg.js";
const app = express();
app.use(cors());
app.use(express.json({ limit: "200mb" }));
app.use(
  express.urlencoded({ limit: "200mb", extended: true, parameterLimit: 50000 })
);

const PORT = process.env.PORTNUMBER;
const WS_PORT = process.env.PORT;
// app.listen(PORT, () => {
//   console.log("Application started on port ", PORT);
// });

// const io = new Server(WS_PORT, {
//   cors: {
//     origin: "*",
//   },
// });

const httpServer = http.createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "https://livenex.online",
  },
});
httpServer.listen(PORT, () => {
  console.log(`Socket.IO server is listening on port ${PORT}`);
});

//io.use(verifyToken);
io.on("connection", (socket) => {
  console.log(`socket connected to ${socket.id}`);
  const rtmpUrlYoutube = socket.handshake.query.rtmpUrlYoutube;
  const rtmpUrlfb = socket.handshake.query.rtmUrlFaceBook;
  const ffmpegInput = inputSettings.concat(
    youtubeSettings(rtmpUrlYoutube),
    facebookSettings(rtmpUrlfb)
  );
  const ffmpeg = spawn("ffmpeg", ffmpegInput);

  ffmpeg.on("start", (command) => {
    console.log("FFmpeg command:", command);
  });

  ffmpeg.on("close", (code, signal) => {
    console.log(
      "FFmpeg child process closed, code " + code + ", signal " + signal
    );
  });

  ffmpeg.stdin.on("error", (e) => {
    console.log("FFmpeg STDIN Error", e);
  });

  ffmpeg.stderr.on("data", (data) => {
    console.log("FFmpeg STDERR:", data.toString());
  });

  socket.on("message", (msg) => {
    ffmpeg.stdin.write(msg);
  });

  socket.conn.on("close", (e) => {
    console.log("kill: SIGINT");
    ffmpeg.kill("SIGINT");
  });
});
