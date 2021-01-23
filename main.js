const express = require("express");
const app = express();
const port = 5200;
const bodyParser = require("body-parser");
const multer = require("multer");

const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); //Appending extension
  },
});
const upload = multer({ dest: "./upload" });

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const saveFile = (filePath, quality = "1", extension = "mp4") => {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync("./assets")) {
      fs.mkdir("./assets", () => null);
    }
    exec(
      `ffmpeg -i ./${filePath} -vf "scale=iw/${quality}:ih/${quality}" ./assets/${
        filePath.split("/")[1]
      }-${quality}.mp4`,
      (error, stdout, stderr) => {
        if (error) {
          // console.error(`exec error: ${error}`);
          reject(`exec error: ${error}`);
          return;
        }
        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
        return resolve("Example");
      }
    );
  });
};

const haveHlsStream = (filePath) => {
  return new Promise((resolve, reject) => {
    const fileName = filePath
      .split("/")
      [filePath.split("/").length - 1].replace(".mp4", "");
    if (!fs.existsSync(`./assets/${fileName}`)) {
      fs.mkdir(`./assets/${fileName}`, () => null);
    }
    exec(
      `ffmpeg -i ${filePath} -codec: copy -start_number 0 -hls_time 10 -hls_list_size 0 -f hls ./assets/${fileName}/${fileName}.m3u8`,
      (error, stdout, stderr) => {
        if (error) {
          // console.error(`exec error: ${error}`);
          reject(`exec error: ${error}`);
          return;
        }
        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
        return resolve("Example");
      }
    );
  });
};

app.post("/video-upload", upload.single("video"), async (req, res) => {
  req.setTimeout(99999999);
  `ffmpeg -i input.mp4 -vf "scale=iw/2:ih/2" output.mp4`;
  await saveFile(req.file.path, "1");
  await saveFile(req.file.path, "2");
  await saveFile(req.file.path, "4");
  await saveFile(req.file.path, "8");
  exec(`rm -rf ${req.file.path}`);
  const fileName = req.file.path.split("/")[1];
  await haveHlsStream(`./assets/${fileName}-1.mp4`);
  await haveHlsStream(`./assets/${fileName}-2.mp4`);
  await haveHlsStream(`./assets/${fileName}-4.mp4`);
  await haveHlsStream(`./assets/${fileName}-8.mp4`);
  exec(`rm -rf ./assets/${fileName}-1.mp4`);
  exec(`rm -rf ./assets/${fileName}-2.mp4`);
  exec(`rm -rf ./assets/${fileName}-4.mp4`);
  exec(`rm -rf ./assets/${fileName}-8.mp4`);
  return res.send("Converted All");
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
