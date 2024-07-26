const express = require('express');
const bodyParser = require('body-parser');
const {
  BarcodeFormat,
  DecodeHintType,
  MultiFormatReader,
  BinaryBitmap,
  HybridBinarizer,
  RGBLuminanceSource
} = require('@zxing/library');

const app = express();
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/decode', async (req, res) => {
  try {
    const imageBase64 = req.body.image;

    if (!imageBase64) {
      return res.status(400).json({ error: 'No se proporcionó ninguna imagen' });
    }

    // Eliminar el prefijo "data:image/jpeg;base64," si está presente
    const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");

    // Convertir la cadena base64 a un Uint8Array
    const imageData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    const luminanceSource = new RGBLuminanceSource(imageData, 300, 200); // Ajustar dimensiones si es necesario
    const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));
    const hints = new Map();
    const formats = [BarcodeFormat.QR_CODE, BarcodeFormat.CODE_128, BarcodeFormat.EAN_13];
    hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);

    const reader = new MultiFormatReader();
    const result = reader.decode(binaryBitmap, hints);

    if (result) {
      const decodedData = {
        text: result.getText(),
        format: result.getBarcodeFormat().toString()
      };
      res.json({ data: decodedData });
    } else {
      res.status(400).json({ error: 'No se pudo decodificar el código de barras' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});
