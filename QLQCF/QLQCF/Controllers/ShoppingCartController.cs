using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using QLQCF.Extensions;
using QLQCF.Models;
using QLQCF.Repositories;
using Microsoft.AspNetCore.Mvc.Rendering;
using System.Security.Claims;
using static System.Windows.Forms.VisualStyles.VisualStyleElement.Rebar;

namespace QLQCF.Controllers
{
    public class ShoppingCartController : Controller
    {
        private readonly IProductRepository _productRepository;
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public ShoppingCartController(ApplicationDbContext context, UserManager<ApplicationUser> userManager, IProductRepository productRepository)
        {
            _productRepository = productRepository;
            _context = context;
            _userManager = userManager;
        }
        [Authorize]
        public IActionResult Checkout(int? banId = null, string tenBan = null)
        {
            if (banId != null)
            {
                ViewBag.BanId = banId;
                ViewBag.TenBan = tenBan;
            }

            return View(new Order());
        }
        [HttpPost]
        public async Task<IActionResult> Checkout(Order order)
        {
            var cart = HttpContext.Session.GetObjectFromJson<ShoppingCart>("Cart");
            if (cart == null || !cart.Items.Any())
            {
                TempData["Error"] = "Giỏ hàng của bạn đang trống.";
                return RedirectToAction("Index");
            }

            var user = await _userManager.GetUserAsync(User);

            // Kiểm tra đầu vào
            if (string.IsNullOrWhiteSpace(order.CustomerName))
            {
                TempData["Error"] = "Vui lòng nhập tên khách hàng.";
                return View(order);
            }

            if (string.IsNullOrWhiteSpace(order.ShippingAddress))
            {
                TempData["Error"] = "Vui lòng nhập địa chỉ giao hàng.";
                return View(order);
            }

            // Thiết lập thông tin đơn hàng
            order.UserId = user.Id;
            order.OrderDate = DateTime.UtcNow;
            order.TotalPrice = cart.Items.Sum(i => i.Price * i.Quantity);

            order.OrderDetails = cart.Items.Select(i => new OrderDetail
            {
                ProductId = i.ProductId,
                Quantity = i.Quantity,
                Price = i.Price
            }).ToList();

            // Kiểm tra và trừ nguyên liệu
            foreach (var item in cart.Items)
            {
                var product = await _context.Products
                    .Include(p => p.Recipes)
                        .ThenInclude(r => r.Ingredient)
                    .FirstOrDefaultAsync(p => p.Id == item.ProductId);

                if (product?.Recipes != null)
                {
                    foreach (var recipe in product.Recipes)
                    {
                        var ingredient = recipe.Ingredient;
                        var totalUsed = recipe.AmountNeeded * item.Quantity;

                        if (ingredient.CurrentQuantity < totalUsed)
                        {
                            TempData["Error"] = $"Không đủ nguyên liệu: {ingredient.Name}";
                            return View(order);
                        }

                        ingredient.CurrentQuantity -= totalUsed;
                        //_context.Ingredients.Update(ingredient);

                    }
                }
            }

            // Lưu đơn hàng và cập nhật nguyên liệu
            try
            {
                _context.Orders.Add(order);
                await _context.SaveChangesAsync();

                HttpContext.Session.Remove("Cart");

                return View("OrderCompleted", order.Id);
            }
            catch (Exception ex)
            {
                TempData["Error"] = "Đã xảy ra lỗi khi lưu đơn hàng: " + ex.Message;
                return View(order);
            }
        }

        [HttpPost]
        public async Task<IActionResult> AddToCart([FromBody] AddToCardRequest request)
        {
            var productId = request.ProductId;
            var quantity = request.Quantity;
            var banId = request.BanId;

            var product = await _context.Products.FindAsync(productId);
            if (product == null)
            {
                return Json(new { success = false, message = "Sản phẩm không tồn tại!" });
            }

            // Lấy giỏ hàng từ session hoặc tạo mới
            var cart = HttpContext.Session.GetObjectFromJson<ShoppingCart>("Cart") ?? new ShoppingCart();

            // Kiểm tra nguyên liệu cho sản phẩm
            var recipes = await _context.Recipes
                .Where(r => r.ProductId == productId)
                .ToListAsync();

            foreach (var recipe in recipes)
            {
                var ingredient = await _context.Ingredients.FindAsync(recipe.IngredientId);
                if (ingredient == null)
                {
                    return Json(new { success = false, message = $"Thiếu nguyên liệu: {recipe.IngredientId}" });
                }

                double requiredQty = recipe.AmountNeeded * quantity;
                if (ingredient.CurrentQuantity < requiredQty)
                {
                    return Json(new
                    {
                        success = false,
                        message = $"Không đủ nguyên liệu \"{ingredient.Name}\". Cần {requiredQty}, còn {ingredient.CurrentQuantity}."
                    });
                }
            }

            // Gộp sản phẩm nếu đã có trong giỏ
            var cartItem = cart.Items.FirstOrDefault(i => i.ProductId == productId);
            if (cartItem != null)
            {
                cartItem.Quantity += quantity;
            }
            else
            {
                cart.Items.Add(new CartItem
                {
                    ProductId = productId,
                    Name = product.Name,
                    Price = product.Price,
                    Quantity = quantity,
                    ImageUrl = product.ImageUrl
                });
            }

            // Lưu giỏ hàng và banId vào session
            HttpContext.Session.SetObjectAsJson("Cart", cart);
            HttpContext.Session.SetInt32("BanId", banId);

            // Trả về kết quả
            return Json(new
            {
                success = true,
                message = "Đã thêm vào giỏ hàng!",
                cartItemCount = cart.Items.Sum(i => i.Quantity),
                banId = banId
            });
        }


        [HttpGet]
        public async Task<IActionResult> CheckIngredientAvailability(int productId, int quantity)
        {
            var recipes = _context.Recipes.Where(r => r.ProductId == productId).ToList();
            foreach (var recipe in recipes)
            {
                var ingredient = await _context.Ingredients.FindAsync(recipe.IngredientId);
                if (ingredient == null)
                {
                    return Json(new { success = false, message = $"Không tìm thấy nguyên liệu: {recipe.IngredientId}" });
                }

                var cart = HttpContext.Session.GetObjectFromJson<ShoppingCart>("Cart") ?? new ShoppingCart();
                var currentInCart = cart.Items.FirstOrDefault(i => i.ProductId == productId)?.Quantity ?? 0;

                var totalQty = quantity;
                double required = recipe.AmountNeeded * totalQty;

                if (ingredient.CurrentQuantity < required)
                {
                    return Json(new
                    {
                        success = false,
                        message = $"Không đủ nguyên liệu \"{ingredient.Name}\". Cần {required} {ingredient.Unit}, chỉ còn {ingredient.CurrentQuantity}."
                    });
                }
            }

            return Json(new { success = true });
        }

        [HttpPost]
        public IActionResult UpdateQuantity([FromBody] UpdateQuantityModel model)
        {
            var cart = HttpContext.Session.GetObjectFromJson<ShoppingCart>("Cart");
            if (cart == null) return BadRequest();

            var item = cart.Items.FirstOrDefault(i => i.ProductId == model.ProductId);
            if (item != null)
            {
                item.Quantity = model.Quantity;
                HttpContext.Session.SetObjectAsJson("Cart", cart);
            }

            return Ok();
        }

        public class UpdateQuantityModel
        {
            public int ProductId { get; set; }
            public int Quantity { get; set; }
        }

        public IActionResult Index()
        {
            var cart = HttpContext.Session.GetObjectFromJson<ShoppingCart>("Cart") ?? new ShoppingCart();
            ViewBag.TotalPrice = cart.Items.Sum(i => i.Price * i.Quantity);
            ViewBag.CartItemCount = cart.Items.Sum(i => i.Quantity);
            return View(cart);
        }

        public IActionResult CartPartial()
        {
            var cart = HttpContext.Session.GetObjectFromJson<List<CartItem>>("Cart") ?? new List<CartItem>();
            return PartialView("_CartPartial", cart);
        }
        [HttpPost]
        public IActionResult RemoveFromCart(int productId, string returnUrl = null)
        {
            var cart = HttpContext.Session.GetObjectFromJson<ShoppingCart>("Cart");
            if (cart != null)
            {
                // Xóa sản phẩm khỏi giỏ
                cart.Items.RemoveAll(i => i.ProductId == productId);
                HttpContext.Session.SetObjectAsJson("Cart", cart);
            }

            // Tính tổng số lượng và tổng tiền giỏ hàng
            var totalAmount = cart?.Items.Sum(i => i.Quantity * i.Price) ?? 0;
            var cartItemCount = cart?.Items.Sum(i => i.Quantity) ?? 0;

            // Trả về dữ liệu JSON
            return Json(new
            {
                success = true,
                message = "Sản phẩm đã được xóa",
                cartItemCount = cartItemCount,
                totalAmount = totalAmount
            });
        }




        [HttpPost]
        public IActionResult AdjustQuantity([FromBody] AdjustQuantityRequest request)
        {
            var cart = HttpContext.Session.GetObjectFromJson<ShoppingCart>("Cart");
            if (cart == null)
            {
                return Json(new { success = false, message = "Giỏ hàng không tồn tại." });
            }

            var item = cart.Items.FirstOrDefault(i => i.ProductId == request.ProductId);
            if (item == null)
            {
                return Json(new { success = false, message = "Sản phẩm không có trong giỏ hàng." });
            }

            item.Quantity = Math.Max(1, item.Quantity + request.Change);

            if (item.Quantity == 0)
            {
                cart.Items.Remove(item);
            }

            HttpContext.Session.SetObjectAsJson("Cart", cart);

            return Json(new
            {
                success = true,
                cartItemCount = cart.Items.Sum(i => i.Quantity),
                itemQuantity = item.Quantity,
                totalPrice = cart.Items.Sum(i => i.Quantity * i.Price).ToString("N0") + " VNĐ"
            });
        }

        public class AdjustQuantityRequest
        {
            public int ProductId { get; set; }
            public int Change { get; set; }
        }

        public IActionResult GetCartSummary()
        {
            var cart = HttpContext.Session.GetObjectFromJson<ShoppingCart>("Cart") ?? new ShoppingCart();

            return Json(new
            {
                CartItemCount = cart.Items.Sum(i => i.Quantity),
                TotalPrice = cart.Items.Sum(i => i.Quantity * i.Price),
                CartItems = cart.Items.Select(i => new
                {
                    i.ProductId,
                    i.Name,
                    i.ImageUrl,
                    i.Price,
                    i.Quantity
                }).ToList()
            });
        }
        public async Task<IActionResult> OrderInvoice(int orderId)
        {
            var order = await _context.Orders
                .Include(o => o.ApplicationUser)
                .Include(o => o.OrderDetails)
                .ThenInclude(od => od.Product)
                .FirstOrDefaultAsync(o => o.Id == orderId);

            if (order == null)
                return NotFound();

            var banId = HttpContext.Session.GetInt32("BanId");
            var tenBan = HttpContext.Session.GetString("TenBan");

            if (banId != null)
            {
                var banExists = await _context.Bans.AnyAsync(b => b.Id == banId);
                if (!banExists) banId = null;
                else ViewBag.TenBan = tenBan;
            }

            // ✅ Lấy user đang login (nếu có)
            var currentUserId = _userManager.GetUserId(User);

            // 🔥 Kiểm tra hóa đơn đã lưu chưa
            var existed = await _context.InvoiceHistories.AnyAsync(i => i.OrderId == orderId);
            if (!existed)
            {
                var invoiceHistory = new InvoiceHistory
                {
                    OrderId = order.Id,
                    CreatedAt = DateTime.Now,
                    BanId = banId,
                    UserId = currentUserId ?? order.ApplicationUserId // Ưu tiên user đang login
                };

                _context.InvoiceHistories.Add(invoiceHistory);
                await _context.SaveChangesAsync();
            }

            HttpContext.Session.Remove("BanId");

            return View(order);
        }

        [Authorize]
        public async Task<IActionResult> InvoiceHistoryList()
        {
            var userId = _userManager.GetUserId(User);

            if (string.IsNullOrEmpty(userId))
            {
                // Nếu người dùng chưa đăng nhập, không cho xem
                return RedirectToAction("Login", "Account");
            }

            var histories = await _context.InvoiceHistories
                .Where(h => h.UserId == userId)
                .Include(h => h.Order)
                    .ThenInclude(o => o.OrderDetails)
                        .ThenInclude(od => od.Product)
                .Include(h => h.ApplicationUser)
                .Include(h => h.Ban)
                .OrderByDescending(h => h.CreatedAt)
                .ToListAsync();

            return View(histories);
        }





    }
}
