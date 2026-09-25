import express from "express";
import makeWASocket, {
  useMultiFileAuthState,
  Browsers
} from "@whiskeysockets/baileys";
import P from "pino";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const authFolder = "./auth_info";

let sock;

async function startWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(authFolder);

  sock = makeWASocket({
    auth: state,
    logger: P({ level: "silent" }),
    browser: Browsers.macOS("Desktop")
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", ({ connection }) => {
    console.log("WhatsApp connection:", connection);
  });
}

app.get("/", (req, res) => {
  res.json({
    status: "MUNIB-PJ WhatsApp server is running"
  });
});

app.get("/code", async (req, res) => {
  try {
    const number = String(req.query.number || "").replace(/\D/g, "");

    if (!number) {
      return res.status(400).json({
        error: "number is required"
      });
    }

    if (!sock) {
      return res.status(503).json({
        error: "WhatsApp server is starting"
      });
    }

    const code = await sock.requestPairingCode(number);

    res.json({
      code: code
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Could not create pairing code"
    });
  }
});

app.listen(PORT, () => {
  console.log(`MUNIB-PJ server running on port ${PORT}`);
});

startWhatsApp();
