import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import { spawn } from "child_process";
import { Server } from "socket.io";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });
import verifyToken from "../src/middileware/auth.js";
import {
  youtubeSettings,
  facebookSettings,
  TwitchRtmpSettings,
  inputSettings,
} from "./services/ffmpeg.js";
const app = express();
app.use(cors());
app.use(express.json({ limit: "200mb" }));
app.use(
  express.urlencoded({ limit: "200mb", extended: true, parameterLimit: 50000 })
);
app.use(cookieParser());
const PORT = process.env.PORTNUMBER;
const WS_PORT = process.env.PORT;


const io = new Server(PORT, {
  cors: {
    origin: "https://livenex.online",
  },
});

//io.use(verifyToken);

io.on("connection", (socket) => {
  console.log(`socket connected to ${socket.id}`);
  const rtmpUrlYoutube = socket.handshake.query.rtmpUrlYoutube;
  const rtmpUrlfb = socket.handshake.query.rtmUrlFaceBook;
  const rtmpUrltwich = socket.handshake.query.rtmpUrlTwitch;
  console.log("rtmpUrltwich", rtmpUrltwich);
  const ffmpegInput = inputSettings.concat(
    youtubeSettings(rtmpUrlYoutube),
    facebookSettings(rtmpUrlfb),
    TwitchRtmpSettings(rtmpUrltwich)
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
