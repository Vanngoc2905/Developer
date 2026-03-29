namespace QLQCF.Models;

public class Product
{
    public int Id { get; set; }
    public string Name { get; set; }
    public decimal Price { get; set; }
    public string Description { get; set; }
    public string ImageUrl { get; set; }
    public int CategoryDetailId { get; set; }
    public CategoryDetail CategoryDetail { get; set; }
    public bool Status { get; set; } // True = đang bán, False = ngưng bán

    public virtual ICollection<Recipe> Recipes { get; set; }
}
