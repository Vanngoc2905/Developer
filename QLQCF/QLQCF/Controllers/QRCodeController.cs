using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using System.Drawing;
using ZXing;
using ZXing.Windows.Compatibility;
using ZXing.QrCode;
using QRCoder;
using System.Drawing.Imaging;

namespace QLQCF.Controllers
{
    public class QRCodeController : Controller
    {
        [HttpGet]
        public IActionResult Scan() => View();

        [HttpPost]
        public IActionResult Scan(IFormFile qrImage)
        {
            if (qrImage == null || qrImage.Length == 0)
                return BadRequest("Vui lòng chọn ảnh QR Code.");

            using var stream = qrImage.OpenReadStream();
            using var bitmap = new Bitmap(stream);
            var reader = new BarcodeReader();

            var result = reader.Decode(bitmap);
            if (result != null)
            {
                string text = result.Text;
                if (Uri.IsWellFormedUriString(text, UriKind.Absolute))
                    return Redirect(text);

                return Content($"QR nội dung: {text}");
            }

            return Content("Không thể đọc mã QR.");
        }
        [HttpGet]
        public IActionResult Generate() => View(); // Giao diện nhập nội dung

        [HttpPost]
        public IActionResult Generate(string qrText)
        {
            if (string.IsNullOrWhiteSpace(qrText))
                return BadRequest("Nội dung không được để trống");

            using var qrGenerator = new QRCodeGenerator();
            var qrData = qrGenerator.CreateQrCode(qrText, QRCodeGenerator.ECCLevel.Q);
            using var qrCode = new QRCode(qrData);
            using var bitmap = qrCode.GetGraphic(20);

            using var ms = new MemoryStream();
            bitmap.Save(ms, ImageFormat.Png);
            ms.Seek(0, SeekOrigin.Begin);
            return File(ms.ToArray(), "image/png");
        }

    }
}
