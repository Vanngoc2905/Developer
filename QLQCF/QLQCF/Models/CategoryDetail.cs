
namespace QLQCF.Models
{
    public class CategoryDetail
    {
        public int Id { get; set; }
        public string DetailName { get; set; }
        public int CategoryId { get; set; }
        public Category? Category { get; set; }
        public List<Product>? Products { get; set; }
    }
}
