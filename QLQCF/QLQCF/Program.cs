using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using QLQCF.Models;
using QLQCF.Repositories;

var builder = WebApplication.CreateBuilder(args);

// 1️⃣ Cấu hình DbContext
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

//builder.Services.AddDefaultIdentity<ApplicationUser>(options => options.SignIn.RequireConfirmedAccount = true).AddEntityFrameworkStores<ApplicationDbContext>();


builder.Services.AddIdentity<ApplicationUser, IdentityRole>()
    .AddDefaultTokenProviders()
    .AddDefaultUI()
    .AddEntityFrameworkStores<ApplicationDbContext>();

builder.Services.AddRazorPages();
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromMinutes(30);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
});

builder.Services.AddAuthorization();
builder.Services.AddSession();
builder.Services.AddHttpContextAccessor();
builder.Services.AddControllersWithViews();
builder.Services.AddScoped<IProductRepository, EFProductRepository>();
builder.Services.AddScoped<ICategoryRepository, EFCategoryRepository>();
builder.Services.AddScoped<ICategoryDetailRepository, EFCategoryDetailRepository>();
builder.Services.AddScoped<IBan, EFBan>();
builder.Services.AddScoped<IIngredientRepository, EFIngredientRepository>();
builder.Services.AddScoped<IRecipeRepository, EFRecipeRepository>();
builder.Services.AddControllersWithViews()
    .AddRazorRuntimeCompilation();


var app = builder.Build();

// Middleware pipeline
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
}
app.UseStaticFiles(); // ✅ Bắt buộc để đọc CSS, JS, ảnh...
app.UseRouting();

app.UseSession();
app.UseAuthentication(); // Đăng nhập
app.UseAuthorization(); // Phân quyền

// ??nh tuy?n
app.UseEndpoints(endpoints =>
{
    // Route cho Admin Area
    app.MapControllerRoute(
        name: "areas",
        pattern: "{area:exists}/{controller=Home}/{action=Index}/{id?}"
    );


    // Route m?c ??nh
    endpoints.MapControllerRoute(
        name: "default",
        pattern: "{controller=Home}/{action=Index}/{id?}");

    endpoints.MapRazorPages();
});

app.Run();