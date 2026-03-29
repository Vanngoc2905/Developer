using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using QLQCF.Models;

namespace QLQCF.Controllers
{
    [Route("autologin")]
    public class AutoLoginController : Controller
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly ApplicationDbContext _context;

        public AutoLoginController(UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            ApplicationDbContext context)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> Index(string token)
        {
            if (string.IsNullOrEmpty(token))
                return Content("Không có token truyền vào.");

            var record = _context.AutoLoginTokens
                .FirstOrDefault(t => t.Token.ToLower() == token.ToLower());

            if (record == null)
                return Content($"Token không hợp lệ: {token}");

            var user = await _userManager.FindByIdAsync(record.UserId);
            if (user == null)
                return Content("Không tìm thấy người dùng.");

            var principal = await _signInManager.CreateUserPrincipalAsync(user);
            await HttpContext.SignInAsync(IdentityConstants.ApplicationScheme, principal);

            var redirectUrl = (record.RedirectUrl ?? "/").Trim(); // 🔥 fix lỗi 0x000A
            return Redirect(redirectUrl);
        }



    }
}
