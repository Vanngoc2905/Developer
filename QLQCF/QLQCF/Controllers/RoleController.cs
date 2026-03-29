using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using QLQCF.Models;


public class RoleController : Controller
{
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly UserManager<ApplicationUser> _userManager;

    public RoleController(RoleManager<IdentityRole> roleManager, UserManager<ApplicationUser> userManager)
    {
        _roleManager = roleManager;
        _userManager = userManager;
    }

    // Hiển thị danh sách tài khoản và quyền
    public async Task<IActionResult> Index()
    {
        var users = _userManager.Users.ToList();
        var roles = _roleManager.Roles.ToList();

        // Tạo model
        var model = new RoleViewModel
        {
            Users = users,
            Roles = roles,
            UserManager = _userManager
        };

        // Đảm bảo model không null trước khi trả về View
        if (model == null)
        {
            return View("Error");  // Hoặc hiển thị thông báo lỗi phù hợp
        }

        return View(model);  // Truyền model vào View
    }


    // Thêm quyền cho người dùng
    public async Task<IActionResult> AddRole(string userId, string role)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user != null && !await _userManager.IsInRoleAsync(user, role))
        {
            await _userManager.AddToRoleAsync(user, role);
        }
        return RedirectToAction("Index");
    }

    // Xóa quyền của người dùng
    public async Task<IActionResult> RemoveRole(string userId, string role)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user != null && await _userManager.IsInRoleAsync(user, role))
        {
            await _userManager.RemoveFromRoleAsync(user, role);
        }
        return RedirectToAction("Index");
    }

    // Xóa tài khoản
    public async Task<IActionResult> DeleteUser(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user != null)
        {
            await _userManager.DeleteAsync(user);
        }
        return RedirectToAction("Index");
    }
}
