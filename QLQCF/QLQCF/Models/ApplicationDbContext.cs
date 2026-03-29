using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;


namespace QLQCF.Models;


public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public
   ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }
    public DbSet<Product> Products { get; set; }
    public DbSet<Category> Categories { get; set; }
    public DbSet<Ban> Bans { get; set; }
    public DbSet<ProductImage> ProductImages { get; set; }
    public DbSet<CategoryDetail>  CategoryDetails { get; set; }
    public DbSet<Order> Orders { get; set; }
    public DbSet<OrderDetail> OrderDetails { get; set; }
    public DbSet<Ingredient> Ingredients { get; set; }
    public DbSet<Recipe> Recipes { get; set; }

    public DbSet<InvoiceHistory> InvoiceHistories { get; set; }

    public DbSet<AutoLoginToken> AutoLoginTokens { get; set; }


    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Cấu hình quan hệ nhiều-nhiều giữa Ingredient và Recipe
        modelBuilder.Entity<Recipe>()
            .HasOne(r => r.Ingredient)  // Một Recipe có một Ingredient
            .WithMany(i => i.Recipes)  // Một Ingredient có nhiều Recipe
            .HasForeignKey(r => r.IngredientId); // Định nghĩa khóa ngoại

        // Nếu cần, có thể cấu hình quan hệ nhiều-nhiều bằng cách sử dụng bảng nối (Join Table)
        modelBuilder.Entity<Recipe>()
            .HasOne(r => r.Product)  // Một Recipe liên kết với một Product
            .WithMany(p => p.Recipes)
            .HasForeignKey(r => r.ProductId);

        modelBuilder.Entity<InvoiceHistory>()
       .HasOne(i => i.Order)
       .WithMany()
       .HasForeignKey(i => i.OrderId)
       .OnDelete(DeleteBehavior.Restrict); // hoặc .NoAction nếu dùng EF Core 5+
    }
}