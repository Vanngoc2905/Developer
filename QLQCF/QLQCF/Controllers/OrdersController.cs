using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using QLQCF.Extensions;
using QLQCF.Models;
using QLQCF.Repositories;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;

public class OrdersController : Controller
{
    private readonly ApplicationDbContext _context;

    public OrdersController(ApplicationDbContext context)
    {
        _context = context;
    }

    // 📜 Hiển thị View danh sách đơn hàng (dành cho quản trị viên)
    [HttpGet]
    public async Task<IActionResult> Index(int? month, int? year, string sortOrder)
    {
        ViewBag.CurrentSort = sortOrder;
        ViewBag.DateSortParam = String.IsNullOrEmpty(sortOrder) ? "date_asc" : "";

        // ✅ Truy vấn histories từ InvoiceHistory (chứa Order)
        var historiesQuery = _context.InvoiceHistories
            .Include(h => h.Order)
                .ThenInclude(o => o.OrderDetails)
                    .ThenInclude(od => od.Product)
            .Include(h => h.ApplicationUser)
            .Include(h => h.Ban)
            .AsQueryable();

        // 🔎 Lọc theo tháng
        if (month.HasValue)
        {
            historiesQuery = historiesQuery.Where(h => h.Order.OrderDate.Month == month.Value);
        }

        // 🔎 Lọc theo năm
        if (year.HasValue)
        {
            historiesQuery = historiesQuery.Where(h => h.Order.OrderDate.Year == year.Value);
        }

        // 🔃 Sắp xếp theo thời gian
        switch (sortOrder)
        {
            case "date_asc":
                historiesQuery = historiesQuery.OrderBy(h => h.CreatedAt);
                break;
            default:
                historiesQuery = historiesQuery.OrderByDescending(h => h.CreatedAt);
                break;
        }

        var histories = await historiesQuery.ToListAsync();

        return View(histories);
    }



    [HttpPost]
    public async Task<IActionResult> Delete(int id)
    {
        var order = await _context.Orders.FirstOrDefaultAsync(o => o.Id == id);

        if (order != null)
        {
            var relatedHistories = await _context.InvoiceHistories
                .Where(h => h.OrderId == id)
                .ToListAsync();

            _context.InvoiceHistories.RemoveRange(relatedHistories);

            _context.Orders.Remove(order);
            await _context.SaveChangesAsync();
        }

        return RedirectToAction(nameof(Index));
    }


    [HttpPost]
    public async Task<IActionResult> DeleteMultiple(int[] selectedOrders)
    {
        if (selectedOrders == null || selectedOrders.Length == 0)
            return RedirectToAction(nameof(Index));

        var histories = _context.InvoiceHistories
            .Where(h => selectedOrders.Contains(h.OrderId));
        _context.InvoiceHistories.RemoveRange(histories);

        var orders = await _context.Orders
            .Where(o => selectedOrders.Contains(o.Id))
            .ToListAsync();

        _context.Orders.RemoveRange(orders);
        await _context.SaveChangesAsync();

        return RedirectToAction(nameof(Index));
    }





}
